import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  targetType: z.enum(['ALL_POSTS', 'SPECIFIC_POSTS', 'HASHTAG_POSTS', 'RECENT_POSTS']),
  targetPostUrls: z.array(z.string()).default([]),
  targetHashtags: z.array(z.string()).default([]),
  targetDateRange: z.string().optional(),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  keywordLogic: z.enum(['OR', 'AND']).default('OR'),
  caseSensitive: z.boolean().default(false),
  excludeKeywords: z.array(z.string()).default([]),
  mustBeFollower: z.boolean().default(true),
  cooldownHours: z.number().default(24),
  minAccountAgeDays: z.number().optional(),
  requirePublicAccount: z.boolean().default(false),
  minCommentLength: z.number().optional(),
  maxCommentLength: z.number().optional(),
  messageTemplateId: z.string().optional(),
  scheduleType: z.enum(['IMMEDIATE', 'SCHEDULED', 'RECURRING']).default('IMMEDIATE'),
  scheduledStartAt: z.string().optional(),
  scheduledEndAt: z.string().optional(),
  maxDmsPerDay: z.number().default(50),
  priority: z.number().default(0),
});

// GET - List all rules for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.automationRule.findMany({
      where: { userId: session.user.id },
      include: {
        messageTemplate: {
          select: {
            id: true,
            name: true,
            content: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Get rules error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rules' },
      { status: 500 }
    );
  }
}

// POST - Create new rule
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRuleSchema.parse(body);

    // If message template is provided, verify it belongs to user
    if (validatedData.messageTemplateId) {
      const template = await prisma.messageTemplate.findFirst({
        where: {
          id: validatedData.messageTemplateId,
          userId: session.user.id,
        },
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Invalid message template' },
          { status: 400 }
        );
      }
    }

    const rule = await prisma.automationRule.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        targetType: validatedData.targetType,
        targetPostUrls: validatedData.targetPostUrls,
        targetHashtags: validatedData.targetHashtags,
        targetDateRange: validatedData.targetDateRange,
        keywords: validatedData.keywords,
        keywordLogic: validatedData.keywordLogic,
        caseSensitive: validatedData.caseSensitive,
        excludeKeywords: validatedData.excludeKeywords,
        mustBeFollower: validatedData.mustBeFollower,
        cooldownHours: validatedData.cooldownHours,
        minAccountAgeDays: validatedData.minAccountAgeDays,
        requirePublicAccount: validatedData.requirePublicAccount,
        minCommentLength: validatedData.minCommentLength,
        maxCommentLength: validatedData.maxCommentLength,
        messageTemplateId: validatedData.messageTemplateId,
        scheduleType: validatedData.scheduleType,
        scheduledStartAt: validatedData.scheduledStartAt
          ? new Date(validatedData.scheduledStartAt)
          : undefined,
        scheduledEndAt: validatedData.scheduledEndAt
          ? new Date(validatedData.scheduledEndAt)
          : undefined,
        maxDmsPerDay: validatedData.maxDmsPerDay,
        priority: validatedData.priority,
      },
      include: {
        messageTemplate: true,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create rule error:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}
