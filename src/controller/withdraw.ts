import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/prisma.js';
import { 
  WithdrawalStatus, 
  TransactionType, 
  TransactionStatus,
  Prisma 
} from '../../generated/prisma/index.js';

export const withdrawalController = {
  // Create a new withdrawal
  async createWithdrawal(req: Request, res: Response) {
    try {
      const { userId, amount, destinationAddress } = req.body;

      // Validate required fields
      if (!userId || amount === undefined || !destinationAddress) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'userId, amount, and destinationAddress are required',
        });
      }

      // 1. Minimum withdrawal validation
      if (amount < 10) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Minimum withdrawal amount is 10',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'User not found',
        });
      }

      // Use a transaction to ensure atomicity (Check Balance -> Deduct -> Create Record)
      const result = await prisma.$transaction(async (tx) => {
        // 2. Refresh wallet fetch for lock/latest balance
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        
        if (!wallet) {
           throw new Error('User does not have a wallet');
        }

        if (wallet.balance < amount) {
           throw new Error('Insufficient wallet balance');
        }

        // 3. Deduct Balance Immediately (Sync Wallet & User)
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: amount }
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            usdtBalance: { decrement: amount }
          }
        });

        // 4. Create Withdrawal Request
        const withdrawal = await tx.withdrawal.create({
          data: {
            userId,
            amount,
            destinationAddress,
            status: WithdrawalStatus.PENDING,
            processedAt: null,
          }
        });

        // 5. Create Transaction Record
        await tx.transaction.create({
          data: {
            userId,
            type: TransactionType.WITHDRAW,
            amount: new Prisma.Decimal(amount),
            status: TransactionStatus.PENDING,
            description: `Withdrawal request to ${destinationAddress}`,
            currency: wallet.currency
          }
        });

        return withdrawal;
      });

      return res.status(StatusCodes.CREATED).json({
        message: 'Withdrawal request created successfully',
        data: result,
      });

    } catch (error: any) {
      console.error('Error creating withdrawal:', error);
      if (error.message === 'Insufficient wallet balance' || error.message === 'User does not have a wallet') {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create withdrawal',
      });
    }
  },

  // Get a withdrawal by ID
  async getWithdrawalById(req: Request, res: Response) {
    try {
      const id  = req.params.id as string;

      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!withdrawal) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Withdrawal not found',
        });
      }

      return res.status(StatusCodes.OK).json({
        data: withdrawal,
      });
    } catch (error) {
      console.error('Error fetching withdrawal:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch withdrawal',
      });
    }
  },

  // Get all withdrawals
  async getAllWithdrawals(req: Request, res: Response) {
    try {
      const withdrawals = await prisma.withdrawal.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.status(StatusCodes.OK).json({
        data: withdrawals,
      });
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch withdrawals',
      });
    }
  },

  // Update a withdrawal (Admin Action)
  async updateWithdrawal(req: Request, res: Response) {
    try {
      const id  = req.params.id as string;
      const { status } = req.body;

      if (!status || !Object.values(WithdrawalStatus).includes(status)) {
         return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Invalid withdrawal status',
         });
      }

      // Check if withdrawal exists
      const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
      if (!withdrawal) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Withdrawal not found',
        });
      }

      // Prevent modifying already processed withdrawals
      if (withdrawal.status !== WithdrawalStatus.PENDING) {
         return res.status(StatusCodes.BAD_REQUEST).json({
             error: `Cannot change status of a ${withdrawal.status} withdrawal`,
         });
      }

      const updatedWithdrawal = await prisma.$transaction(async (tx) => {
         // Update Withdrawal Status
         const updated = await tx.withdrawal.update({
            where: { id },
            data: {
                status: status,
                processedAt: new Date()
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
         });

         // Logic based on status
         if (status === WithdrawalStatus.APPROVED) {
             // Deducted on creation, just update transaction status
             const pendingTx = await tx.transaction.findFirst({
                 where: {
                     userId: withdrawal.userId,
                     type: TransactionType.WITHDRAW,
                     status: TransactionStatus.PENDING,
                     amount: withdrawal.amount
                 },
                 orderBy: { createdAt: 'desc' }
             });

             if (pendingTx) {
                 await tx.transaction.update({
                     where: { id: pendingTx.id },
                     data: { status: TransactionStatus.SUCCESS }
                 });
             }

         } else if (status === WithdrawalStatus.REJECTED) {
             // REFUND THE USER (Sync Wallet & User)
             await tx.wallet.update({
                 where: { userId: withdrawal.userId },
                 data: {
                     balance: { increment: withdrawal.amount }
                 }
             });

             await tx.user.update({
                where: { id: withdrawal.userId },
                data: {
                    usdtBalance: { increment: withdrawal.amount }
                }
             });

             // Update Transaction to FAILED
             const pendingTx = await tx.transaction.findFirst({
                where: {
                    userId: withdrawal.userId,
                    type: TransactionType.WITHDRAW,
                    status: TransactionStatus.PENDING,
                    amount: withdrawal.amount
                },
                orderBy: { createdAt: 'desc' }
            });

            if (pendingTx) {
                await tx.transaction.update({
                    where: { id: pendingTx.id },
                    data: { status: TransactionStatus.FAILED, description: 'Withdrawal Rejected - Refunded' }
                });
            } else {
                // If not found, create a refund record (should not happen normally)
                await tx.transaction.create({
                    data: {
                        userId: withdrawal.userId,
                        type: TransactionType.WITHDRAW,
                        amount: withdrawal.amount,
                        status: TransactionStatus.FAILED,
                        description: 'Withdrawal Rejected - Refunded'
                    }
                });
            }
         }

         return updated;
      });

      return res.status(StatusCodes.OK).json({
        message: `Withdrawal ${status.toLowerCase()} successfully`,
        data: updatedWithdrawal,
      });

    } catch (error: any) {
      console.error('Error updating withdrawal:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Failed to update withdrawal',
      });
    }
  },

  // Delete a withdrawal
  async deleteWithdrawal(req: Request, res: Response) {
    try {
      const id  = req.params.id as string;

      const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
      if (!withdrawal) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Withdrawal not found',
        });
      }

      // Only allow deleting if PENDING
      if (withdrawal.status === WithdrawalStatus.PENDING) {
         // Refund (Sync Wallet & User)
         await prisma.$transaction(async (tx) => {
             await tx.wallet.update({
                 where: { userId: withdrawal.userId },
                 data: { balance: { increment: withdrawal.amount } }
             });
             await tx.user.update({
                where: { id: withdrawal.userId },
                data: { usdtBalance: { increment: withdrawal.amount } }
             });
             await tx.withdrawal.delete({ where: { id } });
         });
      } else {
           // Completed history
           await prisma.withdrawal.delete({ where: { id } });
      }

      return res.status(StatusCodes.OK).json({
        message: 'Withdrawal deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting withdrawal:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to delete withdrawal',
      });
    }
  },

  // Get withdrawals by user ID
  async getWithdrawalsByUserId(req: Request, res: Response) {
    try {
      const userId  = req.params.userId as string;
      
      const withdrawals = await prisma.withdrawal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.status(StatusCodes.OK).json({
        data: withdrawals,
      });
    } catch (error) {
      console.error('Error fetching withdrawals by user:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch withdrawals',
      });
    }
  },
};