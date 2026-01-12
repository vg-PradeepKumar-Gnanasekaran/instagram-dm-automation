import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get single rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rule = await prisma.automationRule.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        messageTemplate: true,
      },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Get rule error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rule' },
      { status: 500 }
    );
  }
}

// PATCH - Update rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify rule belongs to user
    const existingRule = await prisma.automationRule.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const updatedRule = await prisma.automationRule.update({
      where: { id: params.id },
      data: {
        ...body,
        scheduledStartAt: body.scheduledStartAt
          ? new Date(body.scheduledStartAt)
          : undefined,
        scheduledEndAt: body.scheduledEndAt
          ? new Date(body.scheduledEndAt)
          : undefined,
      },
      include: {
        messageTemplate: true,
      },
    });

    return NextResponse.json({ rule: updatedRule });
  } catch (error) {
    console.error('Update rule error:', error);
    return NextResponse.json(
      { error: 'Failed to update rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify rule belongs to user
    const existingRule = await prisma.automationRule.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    await prisma.automationRule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Delete rule error:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
