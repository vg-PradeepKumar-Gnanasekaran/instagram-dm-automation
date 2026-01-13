import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Initiate Instagram OAuth flow
 * Redirects user to Instagram authorization page
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || !redirectUri) {
      return NextResponse.json(
        { error: 'Instagram OAuth not configured' },
        { status: 500 }
      );
    }

    // Instagram Graph API via Facebook Login
    // Required for business features (comments, messaging APIs)
    const scopes = [
      'instagram_basic',
      'instagram_manage_comments',
      'instagram_manage_messages',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    // Use Facebook OAuth for Instagram Graph API
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes}&response_type=code&state=${session.user.id}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Instagram connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Instagram connection' },
      { status: 500 }
    );
  }
}
