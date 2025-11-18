const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Get all support tickets
const getAllSupportTickets = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                skip: Number(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            }),
            prisma.supportTicket.count({ where })
        ]);
        res.status(200).json({
            success: true,
            data: tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch support tickets',
            error: error.message,
        });
    }
};
// Get a single support ticket by ID
const getSupportTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found',
            });
        }
        res.status(200).json({
            success: true,
            data: ticket,
        });
    }
    catch (error) {
        console.error('Error fetching support ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch support ticket',
            error: error.message,
        });
    }
};
// Get support tickets by user ID
const getSupportTicketsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const where = { userId, ...(status && { status }) };
        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                skip: Number(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            }),
            prisma.supportTicket.count({ where })
        ]);
        res.status(200).json({
            success: true,
            data: tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching user support tickets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user support tickets',
            error: error.message,
        });
    }
};
// Create a new support ticket
const createSupportTicket = async (req, res) => {
    try {
        const { userId, subject, description } = req.body;
        if (!userId || !subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'userId, subject, and description are required',
            });
        }
        // Optional: Verify user exists
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        const ticket = await prisma.supportTicket.create({
            data: {
                userId,
                subject,
                description,
                // status defaults to OPEN
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: ticket,
        });
    }
    catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create support ticket',
            error: error.message,
        });
    }
};
// Update a support ticket
const updateSupportTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, description, status } = req.body;
        const existingTicket = await prisma.supportTicket.findUnique({
            where: { id },
        });
        if (!existingTicket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found',
            });
        }
        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                subject,
                description,
                status,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        res.status(200).json({
            success: true,
            data: ticket,
        });
    }
    catch (error) {
        console.error('Error updating support ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update support ticket',
            error: error.message,
        });
    }
};
// Delete a support ticket
const deleteSupportTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found',
            });
        }
        await prisma.supportTicket.delete({
            where: { id },
        });
        res.status(200).json({
            success: true,
            message: 'Support ticket deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting support ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete support ticket',
            error: error.message,
        });
    }
};
module.exports = {
    getAllSupportTickets,
    getSupportTicketById,
    getSupportTicketsByUserId,
    createSupportTicket,
    updateSupportTicket,
    deleteSupportTicket,
};
export {};
//# sourceMappingURL=support.js.map