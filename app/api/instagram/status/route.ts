import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Check Instagram connection status for current user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        instagramUserId: true,
        instagramUsername: true,
        instagramToken: true,
        instagramTokenExpiry: true,
      },
    });

    const connected = !!(user?.instagramUserId && user?.instagramToken);

    return NextResponse.json({
      connected,
      username: user?.instagramUsername || undefined,
      userId: user?.instagramUserId || undefined,
      tokenExpiry: user?.instagramTokenExpiry?.toISOString() || undefined,
    });
  } catch (error) {
    console.error('Instagram status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Instagram status' },
      { status: 500 }
    );
  }
}
