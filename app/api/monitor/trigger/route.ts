import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { monitorUserComments } from '@/lib/comment-monitor';

/**
 * Manually trigger comment monitoring for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger comment monitoring in background
    monitorUserComments(session.user.id).catch((error) => {
      console.error('Background monitoring error:', error);
    });

    return NextResponse.json({
      message: 'Comment monitoring triggered successfully',
    });
  } catch (error) {
    console.error('Trigger monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger monitoring' },
      { status: 500 }
    );
  }
}
