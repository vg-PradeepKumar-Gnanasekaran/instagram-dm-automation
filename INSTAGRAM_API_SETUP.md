# Instagram API Setup Guide

## Overview
To enable Instagram DM automation, you need to set up a Facebook/Meta App and get API credentials. This guide walks you through the entire process.

## Prerequisites
- Instagram Business or Creator Account
- Facebook Page connected to your Instagram account
- Facebook Developer Account

## Step-by-Step Setup

### 1. Create a Meta/Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Business"** as the app type
4. Fill in:
   - **App Name**: "Instagram DM Automation" (or your choice)
   - **App Contact Email**: Your email
   - **Business Account**: Select or create one
5. Click **"Create App"**

### 2. Add Instagram Product

1. In your app dashboard, find **"Instagram"** product
2. Click **"Set Up"** next to Instagram Basic Display
3. Scroll down to **"User Token Generator"**
4. Click **"Add or Remove Instagram Accounts"**
5. Log in and authorize your Instagram Business/Creator account

### 3. Configure Instagram Permissions

You need these permissions:
- `instagram_basic` - Basic profile information
- `instagram_content_publish` - Publish content
- `instagram_manage_comments` - Read and reply to comments
- `instagram_manage_messages` - Send and read DMs
- `pages_read_engagement` - Read page engagement
- `pages_manage_metadata` - Manage page metadata

To add permissions:
1. Go to **App Dashboard** → **Instagram** → **Permissions**
2. Request each permission above
3. Submit for review (Meta will review your app)

### 4. Get Your Credentials

1. Go to **Settings** → **Basic**
2. Copy these values:
   - **App ID** → This is your `INSTAGRAM_APP_ID`
   - **App Secret** → Click "Show" and copy → This is your `INSTAGRAM_APP_SECRET`

3. Set up OAuth Redirect URI:
   - Go to **Instagram** → **Basic Display** → **OAuth Redirect URIs**
   - Add: `http://localhost:3000/api/auth/instagram/callback`
   - For production, add: `https://yourdomain.com/api/auth/instagram/callback`

### 5. Update Environment Variables

Add to your `.env.local`:

```env
# Instagram API
INSTAGRAM_APP_ID="your-app-id-here"
INSTAGRAM_APP_SECRET="your-app-secret-here"
INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/auth/instagram/callback"
```

### 6. Get User Access Token

1. Go to **Instagram** → **Basic Display** → **User Token Generator**
2. Click **"Generate Token"** for your Instagram account
3. Copy the long-lived token (valid for 60 days)
4. Store this securely - you'll use it to make API calls

### 7. Test Your Setup

1. In your app, go to **Settings** page
2. Click **"Connect Instagram Account"**
3. Authorize the permissions
4. You should see your Instagram profile connected

## Important Notes

### Rate Limits
- Instagram API has rate limits
- Typical limits: 200 API calls per hour per user
- Be mindful when automating at scale

### App Review Process
Meta requires app review for production use:
1. Your app starts in "Development Mode"
2. In dev mode, only you and added testers can use it
3. For public use, submit for **App Review**
4. Provide:
   - Detailed use case
   - Demo video
   - Privacy policy
   - Terms of service

### Webhook Setup (Advanced)
For real-time comment notifications:
1. Set up a publicly accessible webhook URL
2. Subscribe to Instagram webhooks in app dashboard
3. Handle incoming webhook events

## Troubleshooting

### "App Not Set Up" Error
- Make sure you've added Instagram product to your app
- Verify your redirect URI is correctly configured

### "Permission Denied" Error
- Check that you've requested all required permissions
- Make sure your Instagram account is Business/Creator type

### "Invalid Credentials" Error
- Verify App ID and Secret are correct
- Check that `.env.local` is properly loaded

## Testing Without Full Setup

For development/testing, you can:
1. Use the app in Development Mode with test users
2. Add test Instagram accounts in **Roles** → **Test Users**
3. These test accounts can use all features without app review

## Security Best Practices

1. **Never commit** your App Secret to version control
2. Use environment variables for all sensitive data
3. Implement token refresh for long-lived access
4. Monitor API usage and errors
5. Implement proper error handling for rate limits

## Next Steps

After setup:
1. Test Instagram connection in your app
2. Create automation rules
3. Monitor DM activity in dashboard
4. Adjust rate limits as needed

## Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Facebook App Dashboard](https://developers.facebook.com/apps/)
- [Instagram Business Account Setup](https://help.instagram.com/502981923235522)
