import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/prisma.js';
import { InvestmentStatus, type Investment } from '../../generated/prisma/index.js';

export const investmentController = {
  // Create a new investment
  async createInvestment(req: Request, res: Response) {
    try {
      const { userId, planId, amountInvested, roiPercentage, startDate, endDate } = req.body;

      // Validate required fields
      if (!userId || !planId || amountInvested === undefined || roiPercentage === undefined || !startDate) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'userId, planId, amountInvested, roiPercentage, and startDate are required',
        });
      }

      // Validate numeric fields
      if (amountInvested <= 0 || roiPercentage < 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'amountInvested must be positive, and roiPercentage must be non-negative',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'User not found',
        });
      }

      // Check if subscription plan exists and is active
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Subscription plan not found',
        });
      }
      if (!plan.isActive) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Subscription plan is not active',
        });
      }

      // Validate minimum investment
      if (amountInvested < plan.minimumInvestment) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `Amount invested must be at least ${plan.minimumInvestment}`,
        });
      }

      // Create investment
      const investment = await prisma.investment.create({
        data: {
          userId,
          planId,
          amountInvested,
          roiPercentage,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: InvestmentStatus.ACTIVE,
          totalReturn: null, // Will be updated later based on ROI calculations
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: { id: true, name: true, minimumInvestment: true, roiPerMonth: true },
          },
        },
      });

      return res.status(StatusCodes.CREATED).json({
        message: 'Investment created successfully',
        data: investment,
      });
    } catch (error) {
      console.error('Error creating investment:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to create investment',
      });
    }
  },

  // Get an investment by ID
  async getInvestmentById(req: Request, res: Response) {
    try {
      const id  = req.params.id as string;

      const investment = await prisma.investment.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: { id: true, name: true, minimumInvestment: true, roiPerMonth: true },
          },
          roiRecords: true,
          transactions: true,
        },
      });

      if (!investment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Investment not found',
        });
      }

      return res.status(StatusCodes.OK).json({
        data: investment,
      });
    } catch (error) {
      console.error('Error fetching investment:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch investment',
      });
    }
  },

  // Get all investments
  async getAllInvestments(req: Request, res: Response) {
    try {
      const investments = await prisma.investment.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: { id: true, name: true, minimumInvestment: true, roiPerMonth: true },
          },
        },
      });

      return res.status(StatusCodes.OK).json({
        data: investments,
      });
    } catch (error) {
      console.error('Error fetching investments:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch investments',
      });
    }
  },

  // Update an investment
  async updateInvestment(req: Request, res: Response) {
    try {
      const id  = req.params.id as string;
      const { amountInvested, roiPercentage, startDate, endDate, status, totalReturn } = req.body;

      // Check if investment exists
      const investment = await prisma.investment.findUnique({ where: { id } });
      if (!investment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Investment not found',
        });
      }

      // Prepare update data
      const updateData: Partial<Investment> = {};
      if (amountInvested !== undefined) {
        if (amountInvested <= 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'amountInvested must be positive',
          });
        }
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: investment.planId } });
        if (plan && amountInvested < plan.minimumInvestment) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `Amount invested must be at least ${plan.minimumInvestment}`,
          });
        }
        updateData.amountInvested = amountInvested;
      }
      if (roiPercentage !== undefined) {
        if (roiPercentage < 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'roiPercentage must be non-negative',
          });
        }
        updateData.roiPercentage = roiPercentage;
      }
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      if (status) {
        if (!Object.values(InvestmentStatus).includes(status)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Invalid investment status',
          });
        }
        updateData.status = status;
      }
      if (totalReturn !== undefined) updateData.totalReturn = totalReturn;

      // Update investment
      const updatedInvestment = await prisma.investment.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: { id: true, name: true, minimumInvestment: true, roiPerMonth: true },
          },
        },
      });

      return res.status(StatusCodes.OK).json({
        message: 'Investment updated successfully',
        data: updatedInvestment,
      });
    } catch (error) {
      console.error('Error updating investment:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to update investment',
      });
    }
  },

  // Delete an investment
  async deleteInvestment(req: Request, res: Response) {
    try {
      const id  = req.params.id as string;

      const investment = await prisma.investment.findUnique({ where: { id } });
      if (!investment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Investment not found',
        });
      }

      await prisma.investment.delete({ where: { id } });

      return res.status(StatusCodes.OK).json({
        message: 'Investment deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting investment:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to delete investment',
      });
    }
  },

  // Get ROI records and transactions for an investment
  async getInvestmentDetails(req: Request, res: Response) {
    try {
      const id  = req.params.id as string;

      const investment = await prisma.investment.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: { id: true, name: true, minimumInvestment: true, roiPerMonth: true },
          },
          roiRecords: {
            select: {
              id: true,
              weekNumber: true,
              roiAmount: true,
              isReferralBonusApplied: true,
              createdAt: true,
            },
          },
          transactions: {
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!investment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: 'Investment not found',
        });
      }

      return res.status(StatusCodes.OK).json({
        data: investment,
      });
    } catch (error) {
      console.error('Error fetching investment details:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to fetch investment details',
      });
    }
  },
};