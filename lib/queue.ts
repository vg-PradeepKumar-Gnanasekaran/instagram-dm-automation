import Bull from 'bull';
import { prisma } from '@/lib/prisma';
import { InstagramClient, personalizeMessage } from '@/lib/instagram';

// Create queue for DM sending
export const dmQueue = new Bull('dm-queue', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

interface DmJobData {
  userId: string;
  automationRuleId: string;
  recipientUserId: string;
  recipientUsername: string;
  messageTemplateId?: string;
  messageContent: string;
  triggerComment?: string;
  postUrl?: string;
}

/**
 * Process DM sending jobs
 */
dmQueue.process(async (job) => {
  const data: DmJobData = job.data;

  try {
    // Get user's Instagram token
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        instagramToken: true,
        instagramTokenExpiry: true,
      },
    });

    if (!user || !user.instagramToken) {
      throw new Error('User Instagram token not found');
    }

    // Check if token is expired
    if (user.instagramTokenExpiry && user.instagramTokenExpiry < new Date()) {
      throw new Error('Instagram token expired');
    }

    // Check rate limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dmsToday = await prisma.dmLog.count({
      where: {
        userId: data.userId,
        createdAt: {
          gte: today,
        },
        status: 'SENT',
      },
    });

    const maxDmsPerDay = parseInt(process.env.MAX_DMS_PER_DAY || '200');

    if (dmsToday >= maxDmsPerDay) {
      throw new Error('Daily DM limit reached');
    }

    // Check if user has been contacted recently
    const cooldownHours = parseInt(process.env.COOLDOWN_PERIOD_HOURS || '24');
    const cooldownTime = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);

    const recentContact = await prisma.rateLimitTracker.findUnique({
      where: {
        userId_recipientUserId: {
          userId: data.userId,
          recipientUserId: data.recipientUserId,
        },
      },
    });

    if (recentContact && recentContact.lastContactedAt > cooldownTime) {
      await logDmFailure(data, 'User contacted too recently (cooldown period)');
      return { success: false, reason: 'cooldown' };
    }

    // Check user has enough credits
    const credits = await prisma.credit.findFirst({
      where: { userId: data.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!credits || credits.amount < 1) {
      throw new Error('Insufficient credits');
    }

    // Send DM using Instagram API
    const instagram = new InstagramClient(user.instagramToken);
    const dmSent = await instagram.sendDirectMessage(
      data.recipientUserId,
      data.messageContent
    );

    if (!dmSent) {
      throw new Error('Failed to send DM via Instagram API');
    }

    // Deduct credit
    await prisma.credit.update({
      where: { id: credits.id },
      data: {
        amount: credits.amount - 1,
      },
    });

    // Log successful DM
    await prisma.dmLog.create({
      data: {
        userId: data.userId,
        automationRuleId: data.automationRuleId,
        messageTemplateId: data.messageTemplateId,
        recipientUsername: data.recipientUsername,
        recipientUserId: data.recipientUserId,
        messageContent: data.messageContent,
        triggerComment: data.triggerComment,
        postUrl: data.postUrl,
        status: 'SENT',
        sentAt: new Date(),
        creditsUsed: 1,
      },
    });

    // Update rate limit tracker
    await prisma.rateLimitTracker.upsert({
      where: {
        userId_recipientUserId: {
          userId: data.userId,
          recipientUserId: data.recipientUserId,
        },
      },
      create: {
        userId: data.userId,
        recipientUserId: data.recipientUserId,
        lastContactedAt: new Date(),
        contactCount: 1,
      },
      update: {
        lastContactedAt: new Date(),
        contactCount: {
          increment: 1,
        },
      },
    });

    // Update rule stats
    await prisma.automationRule.update({
      where: { id: data.automationRuleId },
      data: {
        totalSent: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });

    // Update analytics
    await prisma.analyticsDaily.upsert({
      where: {
        userId_date: {
          userId: data.userId,
          date: today,
        },
      },
      create: {
        userId: data.userId,
        date: today,
        dmsSent: 1,
        creditsUsed: 1,
      },
      update: {
        dmsSent: { increment: 1 },
        creditsUsed: { increment: 1 },
      },
    });

    // Create transaction record for credit usage
    await prisma.transaction.create({
      data: {
        userId: data.userId,
        type: 'USAGE',
        amount: -1,
        status: 'COMPLETED',
        description: `DM sent to @${data.recipientUsername}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('DM job error:', error);

    // Log failed DM
    await logDmFailure(data, error instanceof Error ? error.message : 'Unknown error');

    // Update rule stats
    await prisma.automationRule.update({
      where: { id: data.automationRuleId },
      data: {
        totalFailed: { increment: 1 },
      },
    });

    throw error;
  }
});

/**
 * Log failed DM attempt
 */
async function logDmFailure(data: DmJobData, reason: string) {
  await prisma.dmLog.create({
    data: {
      userId: data.userId,
      automationRuleId: data.automationRuleId,
      messageTemplateId: data.messageTemplateId,
      recipientUsername: data.recipientUsername,
      recipientUserId: data.recipientUserId,
      messageContent: data.messageContent,
      triggerComment: data.triggerComment,
      postUrl: data.postUrl,
      status: 'FAILED',
      failureReason: reason,
      creditsUsed: 0,
    },
  });
}

/**
 * Add a DM job to the queue
 */
export async function queueDmJob(data: DmJobData) {
  await dmQueue.add(data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    dmQueue.getWaitingCount(),
    dmQueue.getActiveCount(),
    dmQueue.getCompletedCount(),
    dmQueue.getFailedCount(),
    dmQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}
