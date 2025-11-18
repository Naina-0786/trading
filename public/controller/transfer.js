import { StatusCodes } from 'http-status-codes';
import prisma from '../config/prisma.js';
import { TransferStatus } from '../../generated/prisma/index.js';
export const transferController = {
    // Create a new transfer
    async createTransfer(req, res) {
        try {
            const { senderId, receiverId, amount, status, note } = req.body;
            // Validate required fields
            if (!senderId || !receiverId || amount === undefined) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'senderId, receiverId, and amount are required',
                });
            }
            // Validate amount
            if (amount <= 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'amount must be positive',
                });
            }
            // Validate transfer status if provided
            if (status && !Object.values(TransferStatus).includes(status)) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Invalid transfer status',
                });
            }
            // Check if sender and receiver exist
            const sender = await prisma.user.findUnique({ where: { id: senderId } });
            const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
            if (!sender || !receiver) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Sender or receiver not found',
                });
            }
            // Prevent self-transfer
            if (senderId === receiverId) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Sender and receiver cannot be the same',
                });
            }
            // Check sender's wallet balance
            const senderWallet = await prisma.wallet.findUnique({ where: { userId: senderId } });
            if (!senderWallet) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Sender does not have a wallet',
                });
            }
            if (senderWallet.balance < amount) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Insufficient balance in sender\'s wallet',
                });
            }
            // Check receiver's wallet existence
            const receiverWallet = await prisma.wallet.findUnique({ where: { userId: receiverId } });
            if (!receiverWallet) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Receiver does not have a wallet',
                });
            }
            // Create transfer
            const transfer = await prisma.transfer.create({
                data: {
                    senderId,
                    receiverId,
                    amount,
                    status: status || TransferStatus.PENDING,
                    note,
                },
                include: {
                    sender: {
                        select: { id: true, name: true, email: true },
                    },
                    receiver: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            return res.status(StatusCodes.CREATED).json({
                message: 'Transfer created successfully',
                data: transfer,
            });
        }
        catch (error) {
            console.error('Error creating transfer:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to create transfer',
            });
        }
    },
    // Get a transfer by ID
    async getTransferById(req, res) {
        try {
            const id = req.params.id;
            const transfer = await prisma.transfer.findUnique({
                where: { id },
                include: {
                    sender: {
                        select: { id: true, name: true, email: true },
                    },
                    receiver: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            if (!transfer) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Transfer not found',
                });
            }
            return res.status(StatusCodes.OK).json({
                data: transfer,
            });
        }
        catch (error) {
            console.error('Error fetching transfer:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to fetch transfer',
            });
        }
    },
    // Get all transfers
    async getAllTransfers(req, res) {
        try {
            const transfers = await prisma.transfer.findMany({
                include: {
                    sender: {
                        select: { id: true, name: true, email: true },
                    },
                    receiver: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            return res.status(StatusCodes.OK).json({
                data: transfers,
            });
        }
        catch (error) {
            console.error('Error fetching transfers:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to fetch transfers',
            });
        }
    },
    // Update a transfer
    async updateTransfer(req, res) {
        try {
            const id = req.params.id;
            const { amount, status, note } = req.body;
            // Check if transfer exists
            const transfer = await prisma.transfer.findUnique({ where: { id } });
            if (!transfer) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Transfer not found',
                });
            }
            // Prepare update data
            const updateData = {};
            if (amount !== undefined) {
                if (amount <= 0) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        error: 'amount must be positive',
                    });
                }
                // Re-check sender's wallet balance if amount is updated
                const senderWallet = await prisma.wallet.findUnique({ where: { userId: transfer.senderId } });
                if (!senderWallet || senderWallet.balance < amount) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        error: 'Insufficient balance in sender\'s wallet for updated amount',
                    });
                }
                updateData.amount = amount;
            }
            if (status) {
                if (!Object.values(TransferStatus).includes(status)) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        error: 'Invalid transfer status',
                    });
                }
                updateData.status = status;
            }
            if (note !== undefined)
                updateData.note = note;
            // Update wallet balances if status changes to SUCCESS
            if (status === TransferStatus.SUCCESS && transfer.status !== TransferStatus.SUCCESS) {
                const senderWallet = await prisma.wallet.findUnique({ where: { userId: transfer.senderId } });
                const receiverWallet = await prisma.wallet.findUnique({ where: { userId: transfer.receiverId } });
                if (!senderWallet || !receiverWallet) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        error: 'Sender or receiver wallet not found',
                    });
                }
                if (senderWallet.balance < (amount || transfer.amount)) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        error: 'Insufficient balance in sender\'s wallet',
                    });
                }
                // Update sender and receiver wallet balances
                await prisma.$transaction([
                    prisma.wallet.update({
                        where: { userId: transfer.senderId },
                        data: { balance: { decrement: amount || transfer.amount } },
                    }),
                    prisma.wallet.update({
                        where: { userId: transfer.receiverId },
                        data: { balance: { increment: amount || transfer.amount } },
                    }),
                ]);
            }
            // Update transfer
            const updatedTransfer = await prisma.transfer.update({
                where: { id },
                data: updateData,
                include: {
                    sender: {
                        select: { id: true, name: true, email: true },
                    },
                    receiver: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            return res.status(StatusCodes.OK).json({
                message: 'Transfer updated successfully',
                data: updatedTransfer,
            });
        }
        catch (error) {
            console.error('Error updating transfer:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to update transfer',
            });
        }
    },
    // Delete a transfer
    async deleteTransfer(req, res) {
        try {
            const id = req.params.id;
            const transfer = await prisma.transfer.findUnique({ where: { id } });
            if (!transfer) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Transfer not found',
                });
            }
            // Prevent deletion of SUCCESS transfers
            if (transfer.status === TransferStatus.SUCCESS) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Cannot delete a successful transfer',
                });
            }
            await prisma.transfer.delete({ where: { id } });
            return res.status(StatusCodes.OK).json({
                message: 'Transfer deleted successfully',
            });
        }
        catch (error) {
            console.error('Error deleting transfer:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to delete transfer',
            });
        }
    },
    // Get transfers by sender ID
    async getTransfersBySenderId(req, res) {
        try {
            const senderId = req.params.senderId;
            const sender = await prisma.user.findUnique({ where: { id: senderId } });
            if (!sender) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Sender not found',
                });
            }
            const transfers = await prisma.transfer.findMany({
                where: { senderId },
                include: {
                    sender: {
                        select: { id: true, name: true, email: true },
                    },
                    receiver: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            return res.status(StatusCodes.OK).json({
                data: transfers,
            });
        }
        catch (error) {
            console.error('Error fetching transfers by sender:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to fetch transfers',
            });
        }
    },
    // Get transfers by receiver ID
    async getTransfersByReceiverId(req, res) {
        try {
            const receiverId = req.params.receiverId;
            const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
            if (!receiver) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Receiver not found',
                });
            }
            const transfers = await prisma.transfer.findMany({
                where: { receiverId },
                include: {
                    sender: {
                        select: { id: true, name: true, email: true },
                    },
                    receiver: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            return res.status(StatusCodes.OK).json({
                data: transfers,
            });
        }
        catch (error) {
            console.error('Error fetching transfers by receiver:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to fetch transfers',
            });
        }
    },
};
//# sourceMappingURL=transfer.js.map