import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get dashboard analytics for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get credit balance
    const credits = await prisma.credit.findFirst({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const creditBalance = credits?.amount || 0;

    // Get active rules count
    const activeRulesCount = await prisma.automationRule.count({
      where: {
        userId,
        isActive: true,
      },
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await prisma.dmLog.aggregate({
      where: {
        userId,
        createdAt: { gte: today },
      },
      _count: {
        _all: true,
      },
    });

    const dmsSentToday = await prisma.dmLog.count({
      where: {
        userId,
        createdAt: { gte: today },
        status: 'SENT',
      },
    });

    const dmsFailedToday = await prisma.dmLog.count({
      where: {
        userId,
        createdAt: { gte: today },
        status: 'FAILED',
      },
    });

    // Get this week's stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const dmsSentThisWeek = await prisma.dmLog.count({
      where: {
        userId,
        createdAt: { gte: weekAgo },
        status: 'SENT',
      },
    });

    // Get this month's stats
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dmsSentThisMonth = await prisma.dmLog.count({
      where: {
        userId,
        createdAt: { gte: monthAgo },
        status: 'SENT',
      },
    });

    // Calculate success rate
    const totalAttempts = dmsSentToday + dmsFailedToday;
    const successRate = totalAttempts > 0 ? (dmsSentToday / totalAttempts) * 100 : 0;

    // Get daily analytics for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyAnalytics = await prisma.analyticsDaily.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Get recent activity (last 20 DMs)
    const recentActivity = await prisma.dmLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        automationRule: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get top performing rules
    const topRules = await prisma.automationRule.findMany({
      where: { userId },
      orderBy: { totalSent: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        totalSent: true,
        totalFailed: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      creditBalance,
      activeRulesCount,
      dmsSentToday,
      dmsSentThisWeek,
      dmsSentThisMonth,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      dailyAnalytics,
      recentActivity,
      topRules,
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}
