import { StatusCodes } from 'http-status-codes';
import prisma from '../config/prisma.js';
export const subscriptionPlanController = {
    // Create a new subscription plan
    async createSubscriptionPlan(req, res) {
        try {
            const { name, minimumInvestment, roiPerMonth, durationInMonths, description, isActive } = req.body;
            // Validate required fields
            if (!name || minimumInvestment === undefined || roiPerMonth === undefined || durationInMonths === undefined) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'name, minimumInvestment, roiPerMonth, and durationInMonths are required',
                });
            }
            // Validate numeric fields
            if (minimumInvestment < 0 || roiPerMonth < 0 || durationInMonths <= 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'minimumInvestment and roiPerMonth must be non-negative, and durationInMonths must be positive',
                });
            }
            // Create subscription plan
            const subscriptionPlan = await prisma.subscriptionPlan.create({
                data: {
                    name,
                    minimumInvestment,
                    roiPerMonth,
                    durationInMonths,
                    description,
                    isActive: isActive !== undefined ? isActive : true,
                },
                select: {
                    id: true,
                    name: true,
                    minimumInvestment: true,
                    roiPerMonth: true,
                    durationInMonths: true,
                    description: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return res.status(StatusCodes.CREATED).json({
                message: 'Subscription plan created successfully',
                data: subscriptionPlan,
            });
        }
        catch (error) {
            console.error('Error creating subscription plan:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to create subscription plan',
            });
        }
    },
    // Get a subscription plan by ID
    async getSubscriptionPlanById(req, res) {
        try {
            const id = req.params.id;
            const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
                where: { id },
                include: {
                    investments: {
                        select: {
                            id: true,
                            userId: true,
                            amountInvested: true,
                            status: true,
                            startDate: true,
                            endDate: true,
                        },
                    },
                },
            });
            if (!subscriptionPlan) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Subscription plan not found',
                });
            }
            return res.status(StatusCodes.OK).json({
                data: subscriptionPlan,
            });
        }
        catch (error) {
            console.error('Error fetching subscription plan:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to fetch subscription plan',
            });
        }
    },
    // Get all subscription plans
    async getAllSubscriptionPlans(req, res) {
        try {
            const subscriptionPlans = await prisma.subscriptionPlan.findMany({
                select: {
                    id: true,
                    name: true,
                    minimumInvestment: true,
                    roiPerMonth: true,
                    durationInMonths: true,
                    description: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return res.status(StatusCodes.OK).json({
                data: subscriptionPlans,
            });
        }
        catch (error) {
            console.error('Error fetching subscription plans:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to fetch subscription plans',
            });
        }
    },
    // Update a subscription plan
    async updateSubscriptionPlan(req, res) {
        try {
            const id = req.params.id;
            const { name, minimumInvestment, roiPerMonth, durationInMonths, description, isActive } = req.body;
            // Check if subscription plan exists
            const subscriptionPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
            if (!subscriptionPlan) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Subscription plan not found',
                });
            }
            // Check for active investments if setting isActive to false
            if (isActive === false) {
                const activeInvestments = await prisma.investment.count({
                    where: { planId: id, status: 'ACTIVE' },
                });
                if (activeInvestments > 0) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        error: 'Cannot deactivate plan with active investments',
                    });
                }
            }
            // Prepare update data
            const updateData = {};
            if (name)
                updateData.name = name;
            if (minimumInvestment !== undefined)
                updateData.minimumInvestment = minimumInvestment;
            if (roiPerMonth !== undefined)
                updateData.roiPerMonth = roiPerMonth;
            if (durationInMonths !== undefined)
                updateData.durationInMonths = durationInMonths;
            if (description !== undefined)
                updateData.description = description;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            // Validate numeric fields
            if (minimumInvestment !== undefined && minimumInvestment < 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'minimumInvestment must be non-negative',
                });
            }
            if (roiPerMonth !== undefined && roiPerMonth < 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'roiPerMonth must be non-negative',
                });
            }
            if (durationInMonths !== undefined && durationInMonths <= 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'durationInMonths must be positive',
                });
            }
            // Update subscription plan
            const updatedSubscriptionPlan = await prisma.subscriptionPlan.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    minimumInvestment: true,
                    roiPerMonth: true,
                    durationInMonths: true,
                    description: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return res.status(StatusCodes.OK).json({
                message: 'Subscription plan updated successfully',
                data: updatedSubscriptionPlan,
            });
        }
        catch (error) {
            console.error('Error updating subscription plan:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to update subscription plan',
            });
        }
    },
    // Delete a subscription plan
    async deleteSubscriptionPlan(req, res) {
        try {
            const id = req.params.id;
            // Check if subscription plan exists
            const subscriptionPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
            if (!subscriptionPlan) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Subscription plan not found',
                });
            }
            // Check for existing investments
            const investmentCount = await prisma.investment.count({ where: { planId: id } });
            if (investmentCount > 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Cannot delete plan with existing investments',
                });
            }
            await prisma.subscriptionPlan.delete({ where: { id } });
            return res.status(StatusCodes.OK).json({
                message: 'Subscription plan deleted successfully',
            });
        }
        catch (error) {
            console.error('Error deleting subscription plan:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to delete subscription plan',
            });
        }
    },
    // Get investments for a subscription plan
    async getSubscriptionPlanInvestments(req, res) {
        try {
            const id = req.params.id;
            const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    investments: {
                        select: {
                            id: true,
                            userId: true,
                            amountInvested: true,
                            status: true,
                            startDate: true,
                            endDate: true,
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!subscriptionPlan) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    error: 'Subscription plan not found',
                });
            }
            return res.status(StatusCodes.OK).json({
                data: subscriptionPlan,
            });
        }
        catch (error) {
            console.error('Error fetching investments for subscription plan:', error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to fetch investments',
            });
        }
    },
};
//# sourceMappingURL=subscriptoin.js.map