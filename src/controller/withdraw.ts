import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/prisma.js';
import { WithdrawalStatus, type Withdrawal } from '../../generated/prisma/index.js';

export const withdrawalController = {
  // Create a new withdrawal
  async createWithdrawal(req: Request, res: Response) {
    try {
      const { userId, amount, destinationAddress, status } = req.body;

      // Validate required fields
      if (!userId || amount === undefined || !destinationAddress) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'userId, amount, and destinationAddress are required',
        });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'amount must be positive',
        });
      }

      // Validate withdrawal status if provided
      if (status && !Object.values(WithdrawalStatus).includes(status)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Invalid withdrawal status',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'User not found',
        });
      }

      // Check wallet balance
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'User does not have a wallet',
        });
      }
      if (wallet.balance < amount) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Insufficient wallet balance',
        });
      }

      // Create withdrawal
      const withdrawal = await prisma.withdrawal.create({
        data: {
          userId,
          amount,
          destinationAddress,
          status: status || WithdrawalStatus.PENDING,
          processedAt: null, // Will be set when approved/rejected
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.status(StatusCodes.CREATED).json({
        message: 'Withdrawal request created successfully',
        data: withdrawal,
      });
    } catch (error) {
      console.error('Error creating withdrawal:', error);
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

  // Update a withdrawal
  async updateWithdrawal(req: Request, res: Response) {
    try {
      const id  = req.params.id as string;
      const { amount, destinationAddress, status, processedAt } = req.body;

      // Check if withdrawal exists
      const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
      if (!withdrawal) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Withdrawal not found',
        });
      }

      // Prepare update data
      const updateData: Partial<Withdrawal> = {};
      if (amount !== undefined) {
        if (amount <= 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'amount must be positive',
          });
        }
        // Re-check wallet balance if amount is updated
        const wallet = await prisma.wallet.findUnique({ where: { userId: withdrawal.userId } });
        if (!wallet || wallet.balance < amount) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Insufficient wallet balance for updated amount',
          });
        }
        updateData.amount = amount;
      }
      if (destinationAddress) updateData.destinationAddress = destinationAddress;
      if (status) {
        if (!Object.values(WithdrawalStatus).includes(status)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Invalid withdrawal status',
          });
        }
        updateData.status = status;
        // Set processedAt for APPROVED or REJECTED statuses
        if (status === WithdrawalStatus.APPROVED || status === WithdrawalStatus.REJECTED) {
          updateData.processedAt = processedAt ? new Date(processedAt) : new Date();
        } else {
          updateData.processedAt = null; // Reset processedAt for PENDING
        }
      }
      if (processedAt && (updateData.status === WithdrawalStatus.APPROVED || updateData.status === WithdrawalStatus.REJECTED)) {
        const parsedProcessedAt = new Date(processedAt);
        if (isNaN(parsedProcessedAt.getTime())) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Invalid processedAt date',
          });
        }
        updateData.processedAt = parsedProcessedAt;
      }

      // Update wallet balance if status changes to APPROVED
      if (status === WithdrawalStatus.APPROVED && withdrawal.status !== WithdrawalStatus.APPROVED) {
        await prisma.wallet.update({
          where: { userId: withdrawal.userId },
          data: { balance: { decrement: withdrawal.amount } },
        });
      }

      // Update withdrawal
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.status(StatusCodes.OK).json({
        message: 'Withdrawal updated successfully',
        data: updatedWithdrawal,
      });
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update withdrawal',
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

      // Prevent deletion of APPROVED withdrawals
      if (withdrawal.status === WithdrawalStatus.APPROVED) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Cannot delete an approved withdrawal',
        });
      }

      await prisma.withdrawal.delete({ where: { id } });

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

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'User not found',
        });
      }

      const withdrawals = await prisma.withdrawal.findMany({
        where: { userId },
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