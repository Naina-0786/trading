import prisma from "../config/prisma.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { ErrorResponse } from "../utils/response.util.js";

export const getUserDashboard = asyncHandler(async (req, res, next) => {
  const userId = req.params.id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      referralCode: true,
      usdtBalance: true,
      totalEarnings: true,
    },
  });

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Total Invested: Sum of amountInvested for ACTIVE or COMPLETED investments
  const investmentAggregate = await prisma.investment.aggregate({
    where: {
      userId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    _sum: { amountInvested: true },
  });
  const totalInvested = Number(investmentAggregate._sum.amountInvested || 0);

  // Monthly ROI: Sum of roiAmount for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRoiAggregate = await prisma.rOIRecord.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
    _sum: { roiAmount: true },
  });
  const monthlyRoiAmount = Number(monthlyRoiAggregate._sum.roiAmount || 0);

  // Daily ROI: Sum of roiAmount for today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dailyRoiAggregate = await prisma.rOIRecord.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfDay },
    },
    _sum: { roiAmount: true },
  });
  const dailyRoiAmount = Number(dailyRoiAggregate._sum.roiAmount || 0);

  // Total ROI: Sum of all roiAmount
  const allRoiAggregate = await prisma.rOIRecord.aggregate({
    where: { userId },
    _sum: { roiAmount: true },
  });
  const totalRoi = Number(allRoiAggregate._sum.roiAmount || 0);

  // Profit Earned: Total ROI + Total Earnings
  const profitEarned = totalRoi + Number(user.totalEarnings);

  // ROI Percentage: (Profit / Total Invested) * 100
  const roiPercentage = totalInvested > 0 ? Math.round((profitEarned / totalInvested) * 100) : 0;

  // Current Balance: Total Invested + Profit Earned (assuming invested assets + earnings)
  const currentBalance = totalInvested + profitEarned;

  // Charts Data: All 12 months of the current year for ROI and REFERRAL_BONUS transactions
  const currentYear = now.getFullYear();
  const startDate = new Date(currentYear, 0, 1); // January 1st of current year
  const relevantTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["ROI", "REFERRAL_BONUS"] },
      createdAt: { gte: startDate },
    },
    select: { createdAt: true, amount: true, type: true },
    orderBy: { createdAt: "asc" },
  });

  // Generate all 12 months structure for the current year
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const months: any[] = [];
  for (let i = 0; i < 12; i++) {
    const monthIndex = i;
    const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    months.push({
      key: monthKey,
      month: monthNames[monthIndex],
      total: 0,
      referral: 0,
    });
  }

  // Group transactions by month
  relevantTransactions.forEach((tx) => {
    const date = new Date(tx.createdAt);
    if (date.getFullYear() === currentYear) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthIndex = months.findIndex(m => m.key === monthKey);
      if (monthIndex !== -1) {
        const amt = Number(tx.amount);
        months[monthIndex].total += amt;
        if (tx.type === "REFERRAL_BONUS") {
          months[monthIndex].referral += amt;
        }
      }
    }
  });

  // Calculate balanceData (cumulative total)
  let cumulative = 0;
  const balanceData = months.map((m) => {
    cumulative += m.total;
    return { month: m.month, balance: Math.round(cumulative) };
  });

  // Calculate referralData
  const referralData = months.map((m) => {
    return { month: m.month, earnings: Math.round(m.referral) };
  });

  // Active Subscriptions
  const activeInvestments = await prisma.investment.findMany({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
  });

  const activeSubs = activeInvestments.map((inv: any) => {
    const remainingMonths = Math.ceil(
      (inv.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Determine ROI type and rate
    let roiRate = "0%";
    let roiType = "Monthly"; // Default
    if (inv.plan.roiPerDay) {
      roiRate = `${(Number(inv.plan.roiPerDay) * 100).toFixed(0)}% Daily`;
      roiType = "Daily";
    } else if (inv.plan.roiPerMonth) {
      roiRate = `${(Number(inv.plan.roiPerMonth) * 100).toFixed(0)}% Monthly`;
      roiType = "Monthly";
    }

    return {
      planName: inv.plan.name,
      duration: `${inv.plan.durationInMonths} Months`,
      amountInvested: inv.amountInvested.toString(),
      roiRate, // Dynamic label and value
      roiType, // New field for type (Daily/Monthly)
      remaining: `${remainingMonths} months remaining`,
    };
  });

  // Referral Link
  const referralLink = `https://www.expotradex.com/auth/signup/?referralId=${user.referralCode}`;

  // Structured Dashboard Data
  const dashboardData = {
    userName: user.name || "User",
    referralLink,
    kpis: {
      totalInvested: totalInvested.toFixed(0),
      currentBalance: currentBalance.toFixed(0),
      monthlyROI: monthlyRoiAmount.toFixed(0),
      dailyROI: dailyRoiAmount.toFixed(0),
      referralEarnings: Number(user.totalEarnings).toFixed(0),
    },
    charts: {
      balanceData,
      referralData,
    },
    summary: {
      totalInvested: totalInvested.toFixed(0),
      profitEarned: profitEarned.toFixed(0),
      roiPercentage: `+${roiPercentage}%`,
    },
    activeSubscriptions: {
      count: activeSubs.length,
      plans: activeSubs,
    },
  };

  res.status(200).json({
    success: true,
    data: dashboardData,
  });
});