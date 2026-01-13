import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Instagram Graph API OAuth callback via Facebook Login
 * Flow: Facebook OAuth → Get Pages → Get Instagram Business Account
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=error&message=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=error&message=missing_params`
      );
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      throw new Error('Instagram OAuth not configured');
    }

    // Step 1: Exchange code for Facebook access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=error&message=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Get user's Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=error&message=no_pages_access`
      );
    }

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=error&message=no_pages_found`
      );
    }

    // Step 3: Get Instagram Business Account from first page
    const firstPage = pagesData.data[0];
    const pageAccessToken = firstPage.access_token;
    const pageId = firstPage.id;

    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    if (!igAccountResponse.ok) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=error&message=no_instagram_account`
      );
    }

    const igAccountData = await igAccountResponse.json();

    if (!igAccountData.instagram_business_account) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=error&message=page_not_linked_to_instagram`
      );
    }

    const instagramAccountId = igAccountData.instagram_business_account.id;

    // Step 4: Get Instagram account details
    const igProfileResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username&access_token=${pageAccessToken}`
    );

    let username = null;
    if (igProfileResponse.ok) {
      const igProfileData = await igProfileResponse.json();
      username = igProfileData.username;
    }

    // Step 5: Exchange for long-lived token (60 days)
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${pageAccessToken}`
    );

    let finalToken = pageAccessToken;
    let expiresIn = 5184000; // 60 days default

    if (longLivedTokenResponse.ok) {
      const longLivedData = await longLivedTokenResponse.json();
      finalToken = longLivedData.access_token;
      expiresIn = longLivedData.expires_in || 5184000;
    }

    // Step 6: Update user with Instagram credentials
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    await prisma.user.update({
      where: { id: state },
      data: {
        instagramUserId: instagramAccountId,
        instagramUsername: username,
        instagramToken: finalToken, // In production, encrypt this
        instagramTokenExpiry: tokenExpiry,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=success`
    );
  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?instagram=error&message=callback_failed`
    );
  }
}
