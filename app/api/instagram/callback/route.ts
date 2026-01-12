import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Instagram OAuth callback handler
 * Exchanges authorization code for access token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?instagram=error&message=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?instagram=error&message=missing_params`
      );
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      throw new Error('Instagram OAuth not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?instagram=error&message=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;
    const instagramUserId = tokenData.user_id;

    // Exchange short-lived token for long-lived token
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`
    );

    let accessToken = shortLivedToken;
    let expiresIn = 3600; // 1 hour for short-lived

    if (longLivedTokenResponse.ok) {
      const longLivedData = await longLivedTokenResponse.json();
      accessToken = longLivedData.access_token;
      expiresIn = longLivedData.expires_in || 5184000; // 60 days
    }

    // Get Instagram username
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=username&access_token=${accessToken}`
    );

    let username = null;
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      username = profileData.username;
    }

    // Update user with Instagram credentials
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    await prisma.user.update({
      where: { id: state },
      data: {
        instagramUserId,
        instagramUsername: username,
        instagramToken: accessToken, // In production, encrypt this
        instagramTokenExpiry: tokenExpiry,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?instagram=success`
    );
  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?instagram=error&message=callback_failed`
    );
  }
}
