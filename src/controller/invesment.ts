import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  InvestmentStatus,
  TransactionType,
  TransactionStatus,
  Prisma
} from "../../generated/prisma/index.js";
import prisma from "../config/prisma.js";
import { SuccessResponse } from "../utils/response.util.js";

export const investmentController = {
  // Create a new investment
  async createInvestment(req: Request, res: Response) {
    try {
      const {
        userId,
        planId,
        amountInvested,
        roiPercentage,
        startDate,
        endDate,
        transactionId,
      } = req.body;

      // Validate required fields
      if (
        !userId ||
        !planId ||
        amountInvested === undefined ||
        roiPercentage === undefined ||
        !startDate ||
        !transactionId
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error:
            "userId, planId, amountInvested, roiPercentage, startDate, and transactionId are required",
        });
      }

      // Validate numeric fields
      if (amountInvested <= 0 || roiPercentage < 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error:
            "amountInvested must be positive, and roiPercentage must be non-negative",
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: "User not found",
        });
      }

      // Check if subscription plan exists and is active
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (!plan) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: "Subscription plan not found",
        });
      }
      if (!plan.isActive) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "Subscription plan is not active",
        });
      }

      // Validate minimum investment
      if (amountInvested < Number(plan.minimumInvestment)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `Amount invested must be at least ${plan.minimumInvestment}`,
        });
      }

      // Create investment
      const investment = await prisma.investment.create({
        data: {
          userId: userId as string,
          planId: planId as string,
          amountInvested: new Prisma.Decimal(amountInvested as number),
          roiPercentage: new Prisma.Decimal(roiPercentage as number),
          transactionId: transactionId as string,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: InvestmentStatus.PENDING,
          totalReturn: null, // Will be updated later based on ROI calculations
        } as Prisma.InvestmentUncheckedCreateInput,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: {
              id: true,
              name: true,
              minimumInvestment: true,
              roiPerMonth: true,
            },
          },
        },
      });

      return res.status(StatusCodes.CREATED).json({
        message: "Investment created successfully",
        data: investment,
      });
    } catch (error) {
      console.error("Error creating investment:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to create investment",
      });
    }
  },

  // Get an investment by ID
  async getInvestmentById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const investment = await prisma.investment.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: {
              id: true,
              name: true,
              minimumInvestment: true,
              roiPerMonth: true,
            },
          },
          roiRecords: true,
          transactions: true,
        },
      });

      if (!investment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: "Investment not found",
        });
      }

      return res.status(StatusCodes.OK).json({
        data: investment,
      });
    } catch (error) {
      console.error("Error fetching investment:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch investment",
      });
    }
  },

  // Get all investments
  async getAllInvestments(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [investments, total] = await Promise.all([
        prisma.investment.findMany({
          skip,
          take: limit,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            plan: {
              select: {
                id: true,
                name: true,
                minimumInvestment: true,
                roiPerMonth: true,
              },
            },
          },
        }),
        prisma.investment.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(StatusCodes.OK).json({
        data: investments,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching investments:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch investments",
      });
    }
  },

  // Update an investment
  async updateInvestment(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const {
        amountInvested,
        roiPercentage,
        startDate,
        endDate,
        status,
        totalReturn,
      } = req.body;

      // Check if investment exists
      const investment = await prisma.investment.findUnique({ where: { id } });
      if (!investment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: "Investment not found",
        });
      }

      // Prepare update data
      const updateData: any = {};
      if (amountInvested !== undefined) {
        if (amountInvested <= 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: "amountInvested must be positive",
          });
        }
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: investment.planId },
        });
        if (plan && amountInvested < Number(plan.minimumInvestment)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `Amount invested must be at least ${plan.minimumInvestment}`,
          });
        }
        updateData.amountInvested = new Prisma.Decimal(amountInvested as number);
      }
      if (roiPercentage !== undefined) {
        if (roiPercentage < 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: "roiPercentage must be non-negative",
          });
        }
        updateData.roiPercentage = new Prisma.Decimal(roiPercentage as number);
      }
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate !== undefined)
        updateData.endDate = endDate ? new Date(endDate) : null;
      if (status) {
        if (!Object.values(InvestmentStatus).includes(status)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: "Invalid investment status",
          });
        }
        updateData.status = status;
      }
      if (totalReturn !== undefined) updateData.totalReturn = totalReturn;

      // Update investment
      
      let updatedInvestment;

      // Handle Referral Bonus if status is changed to ACTIVE
      if (status === InvestmentStatus.ACTIVE && investment.status !== InvestmentStatus.ACTIVE) {
        updatedInvestment = await prisma.$transaction(async (tx) => {
          // 1. Update investment
          const inv = await tx.investment.update({
            where: { id },
            data: updateData,
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              plan: {
                select: {
                  id: true,
                  name: true,
                  minimumInvestment: true,
                  roiPerMonth: true,
                },
              },
            },
          });

          // 2. Fetch User and Referrer
          const user = await tx.user.findUnique({
             where: { id: investment.userId },
             include: { referredBy: true }
          });

          // 3. Apply Bonus Logic
          if (user && user.referredBy) {
             const investDate = new Date(investment.createdAt);
             const joinDate = new Date(user.createdAt);
             const diffTime = Math.abs(investDate.getTime() - joinDate.getTime());
             const diffDays = diffTime / (1000 * 60 * 60 * 24);

             let bonusPercent = 0.05; // 5% by default
             if (diffDays <= 10) {
                 bonusPercent = 0.15; // 15% if within 10 days
             }

             // Calculate bonus amount
             const currentAmount = updateData.amountInvested 
                ? Number(updateData.amountInvested) 
                : Number(investment.amountInvested);
             
             const bonusAmount = new Prisma.Decimal(currentAmount * bonusPercent);

             // Update Referrer Wallet/Earnings
             await tx.user.update({
                 where: { id: user.referredBy.id },
                 data: {
                     totalEarnings: { increment: bonusAmount },
                     usdtBalance: { increment: bonusAmount },
                 }
             });

             // Sync Wallet balance
             await tx.wallet.updateMany({
                where: { userId: user.referredBy.id },
                data: {
                    balance: { increment: bonusAmount }
                }
             });

             // Create Transaction Record
             await tx.transaction.create({
                 data: {
                     userId: user.referredBy.id,
                     type: TransactionType.REFERRAL_BONUS,
                     amount: bonusAmount,
                     status: TransactionStatus.SUCCESS,
                     description: `Referral Bonus for user ${user.email || user.id}`,
                     investmentId: investment.id
                 }
             });
          }

          return inv;
        });
      } else {
        // Standard update without bonus
        updatedInvestment = await prisma.investment.update({
            where: { id },
            data: updateData,
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              plan: {
                select: {
                  id: true,
                  name: true,
                  minimumInvestment: true,
                  roiPerMonth: true,
                },
              },
            },
          });
      }

      return res.status(StatusCodes.OK).json({
        message: "Investment updated successfully",
        data: updatedInvestment,
      });
    } catch (error) {
      console.error("Error updating investment:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to update investment",
      });
    }
  },

  // Delete an investment
  async deleteInvestment(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const investment = await prisma.investment.findUnique({ where: { id } });
      if (!investment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: "Investment not found",
        });
      }

      await prisma.investment.delete({ where: { id } });

      return res.status(StatusCodes.OK).json({
        message: "Investment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting investment:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to delete investment",
      });
    }
  },

  // Get ROI records and transactions for an investment
  async getInvestmentDetails(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const investment = await prisma.investment.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          plan: {
            select: {
              id: true,
              name: true,
              minimumInvestment: true,
              roiPerMonth: true,
            },
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
          error: "Investment not found",
        });
      }

      return res.status(StatusCodes.OK).json({
        data: investment,
      });
    } catch (error) {
      console.error("Error fetching investment details:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch investment details",
      });
    }
  },

  
  async accept_reject(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const acceptReject = await prisma.investment.update({
        where: { id },
        data: {
          status: status as InvestmentStatus,
        },
      });

      return SuccessResponse(res, "investment updated successfully", acceptReject);
    } catch (error) {
      console.error("Error fetching investment details:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch investment details",
      });
    }
  },
};