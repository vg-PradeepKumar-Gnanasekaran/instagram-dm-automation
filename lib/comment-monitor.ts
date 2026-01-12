import { prisma } from '@/lib/prisma';
import { InstagramClient, personalizeMessage } from '@/lib/instagram';
import { queueDmJob } from '@/lib/queue';

interface CommentMatchResult {
  matched: boolean;
  rule?: any;
  messageContent?: string;
}

/**
 * Check if a comment matches automation rules for a user
 */
export async function checkCommentAgainstRules(
  userId: string,
  comment: {
    text: string;
    username: string;
    userId: string;
    postUrl?: string;
  }
): Promise<CommentMatchResult> {
  try {
    // Get active automation rules for user
    const rules = await prisma.automationRule.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        messageTemplate: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    if (rules.length === 0) {
      return { matched: false };
    }

    // Get user's Instagram token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        instagramToken: true,
      },
    });

    if (!user?.instagramToken) {
      return { matched: false };
    }

    const instagram = new InstagramClient(user.instagramToken);

    // Check each rule
    for (const rule of rules) {
      // Check if rule should be active based on schedule
      if (rule.scheduleType === 'SCHEDULED') {
        const now = new Date();
        if (rule.scheduledStartAt && now < rule.scheduledStartAt) {
          continue; // Rule not started yet
        }
        if (rule.scheduledEndAt && now > rule.scheduledEndAt) {
          continue; // Rule ended
        }
      }

      // Check daily DM limit for this rule
      if (rule.maxDmsPerDay) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dmsSentToday = await prisma.dmLog.count({
          where: {
            automationRuleId: rule.id,
            createdAt: { gte: today },
            status: 'SENT',
          },
        });

        if (dmsSentToday >= rule.maxDmsPerDay) {
          continue; // Rule daily limit reached
        }
      }

      // Check if comment matches keyword criteria
      if (!matchesKeywords(comment.text, rule)) {
        continue;
      }

      // Check comment length filters
      if (rule.minCommentLength && comment.text.length < rule.minCommentLength) {
        continue;
      }

      if (rule.maxCommentLength && comment.text.length > rule.maxCommentLength) {
        continue;
      }

      // Check if user must be a follower
      if (rule.mustBeFollower) {
        const isFollower = await instagram.isFollower(comment.userId);
        if (!isFollower) {
          continue;
        }
      }

      // Check cooldown period
      if (rule.cooldownHours > 0) {
        const cooldownTime = new Date(Date.now() - rule.cooldownHours * 60 * 60 * 1000);

        const recentContact = await prisma.rateLimitTracker.findUnique({
          where: {
            userId_recipientUserId: {
              userId,
              recipientUserId: comment.userId,
            },
          },
        });

        if (recentContact && recentContact.lastContactedAt > cooldownTime) {
          continue; // User contacted too recently
        }
      }

      // All checks passed - prepare message
      let messageContent = rule.messageTemplate?.content || 'Thank you for your comment!';

      // Personalize message
      messageContent = personalizeMessage(messageContent, {
        username: comment.username,
        firstName: comment.username.split(/[._]/)[0], // Simple first name extraction
        commentText: comment.text,
        postTitle: comment.postUrl || 'our post',
      });

      // Update rule trigger count
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: {
          totalTriggered: { increment: 1 },
        },
      });

      return {
        matched: true,
        rule,
        messageContent,
      };
    }

    return { matched: false };
  } catch (error) {
    console.error('Error checking comment against rules:', error);
    return { matched: false };
  }
}

/**
 * Check if comment text matches keyword criteria
 */
function matchesKeywords(commentText: string, rule: any): boolean {
  const { keywords, keywordLogic, caseSensitive, excludeKeywords } = rule;

  // Check exclude keywords first
  if (excludeKeywords && excludeKeywords.length > 0) {
    for (const excludeKeyword of excludeKeywords) {
      const regex = new RegExp(
        excludeKeyword,
        caseSensitive ? 'g' : 'gi'
      );
      if (regex.test(commentText)) {
        return false; // Comment contains excluded keyword
      }
    }
  }

  // Check include keywords
  if (keywordLogic === 'AND') {
    // All keywords must be present
    return keywords.every((keyword: string) => {
      const regex = new RegExp(keyword, caseSensitive ? 'g' : 'gi');
      return regex.test(commentText);
    });
  } else {
    // At least one keyword must be present (OR)
    return keywords.some((keyword: string) => {
      const regex = new RegExp(keyword, caseSensitive ? 'g' : 'gi');
      return regex.test(commentText);
    });
  }
}

/**
 * Monitor comments on user's posts and trigger automation
 * This should be called periodically (e.g., via cron job or webhook)
 */
export async function monitorUserComments(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        instagramToken: true,
        instagramUserId: true,
      },
    });

    if (!user?.instagramToken || !user.instagramUserId) {
      return;
    }

    const instagram = new InstagramClient(user.instagramToken);

    // Get recent posts
    const posts = await instagram.getUserMedia(10);

    for (const post of posts) {
      // Get comments on this post
      const comments = await instagram.getMediaComments(post.id);

      for (const comment of comments) {
        // Check if we've already processed this comment
        const existingLog = await prisma.dmLog.findFirst({
          where: {
            userId,
            recipientUserId: comment.from.id,
            triggerComment: comment.text,
            postUrl: post.permalink,
          },
        });

        if (existingLog) {
          continue; // Already processed
        }

        // Check comment against rules
        const matchResult = await checkCommentAgainstRules(userId, {
          text: comment.text,
          username: comment.from.username,
          userId: comment.from.id,
          postUrl: post.permalink,
        });

        if (matchResult.matched && matchResult.rule && matchResult.messageContent) {
          // Queue DM job
          await queueDmJob({
            userId,
            automationRuleId: matchResult.rule.id,
            recipientUserId: comment.from.id,
            recipientUsername: comment.from.username,
            messageTemplateId: matchResult.rule.messageTemplateId,
            messageContent: matchResult.messageContent,
            triggerComment: comment.text,
            postUrl: post.permalink,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error monitoring user comments:', error);

    // Log system error
    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        category: 'comment_monitor',
        message: 'Failed to monitor user comments',
        metadata: {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        userId,
      },
    });
  }
}
