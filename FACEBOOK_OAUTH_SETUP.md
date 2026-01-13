# Facebook OAuth Setup Guide (Updated for Business Apps)

## What Changed

The app now uses **Facebook Login** with **Instagram Graph API** instead of Instagram Basic Display. This is the proper way for business automation tools.

## Prerequisites

1. **Instagram Business Account** (not personal)
2. **Facebook Page** linked to your Instagram account
3. **Meta/Facebook Developer Account**

## Setup Steps

### Step 1: Link Instagram to Facebook Page

Before anything, ensure your Instagram is linked to a Facebook Page:

1. Go to your Instagram app → Settings → Account
2. Click "Linked Accounts" → "Facebook"
3. Connect to your Facebook Page
4. Make sure account type is "Business" or "Creator"

### Step 2: Configure Meta App

Go to your app dashboard: https://developers.facebook.com/apps/746087415222736/

### Step 3: Add Facebook Login Product

1. In left sidebar, look for **"Add products"** or find **"Facebook Login for Business"**
2. If not added, click **"Set up"** to add it
3. Click **"Facebook Login for Business"** → **"Settings"**

### Step 4: Add OAuth Redirect URI

In Facebook Login Settings:

1. Find **"Valid OAuth Redirect URIs"** field
2. Add: `http://localhost:3000/api/auth/instagram/callback`
3. For production, also add: `https://yourdomain.com/api/auth/instagram/callback`
4. Click **"Save Changes"**

### Step 5: Request Permissions

Your app needs these permissions:

**Already in App (Standard Access):**
- `public_profile` - Automatically granted
- `email` - Automatically granted

**Need to Request (via App Review for production):**
- `pages_show_list` - List user's Facebook Pages
- `pages_read_engagement` - Read Page engagement
- `instagram_basic` - Basic Instagram profile info
- `instagram_manage_comments` - Read and reply to comments
- `instagram_manage_messages` - Read and send DMs
- `business_management` - Manage business assets

### Step 6: Development Mode (Testing)

For testing/development:
1. Your app is in **Development Mode** by default
2. Only you and test users can use it
3. All permissions work without app review
4. Perfect for testing the integration

To add test users:
1. Go to **"Roles"** in left sidebar
2. Add test users under **"Test Users"** or **"Roles"**

### Step 7: Test the OAuth Flow

1. Restart your dev server: `npm run dev`
2. Go to: `http://localhost:3000/dashboard/settings`
3. Click **"Connect Instagram Account"**
4. You should see Facebook login page
5. Log in with your Facebook account
6. Grant permissions
7. Select Facebook Page (that's linked to Instagram)
8. Redirected back to settings with success message

## New OAuth Flow

### Old Flow (Instagram Basic Display):
```
User → Instagram OAuth → Instagram Token → Limited Access
```

### New Flow (Facebook OAuth with Instagram Graph API):
```
User → Facebook OAuth → Facebook Token
     → Get User's Pages → Get Instagram Account from Page
     → Long-lived Token → Full Business Access
```

## Important Notes

### Must Have:
- ✅ Instagram **Business** or **Creator** account (not personal)
- ✅ Facebook Page **linked** to Instagram account
- ✅ Facebook account has **admin access** to the Page

### Facebook Page Requirement:
Instagram Business accounts are always linked to a Facebook Page. The OAuth flow:
1. Logs in with Facebook
2. Gets list of Pages user manages
3. Finds Instagram account linked to first Page
4. Stores Page access token (works for Instagram too)

### Token Differences:
- **Old (Basic Display)**: Instagram-specific token, limited features
- **New (Graph API)**: Facebook Page token that also controls Instagram, full business features

## Troubleshooting

### Error: "no_pages_found"
- You don't have any Facebook Pages
- Solution: Create a Facebook Page and link your Instagram to it

### Error: "page_not_linked_to_instagram"
- Your Facebook Page is not linked to Instagram
- Solution: Link them in Instagram Settings → Linked Accounts

### Error: "no_instagram_account"
- Page doesn't have Instagram connected
- Solution: Connect Instagram Business account to Facebook Page

### Error: "Invalid platform app"
- App doesn't have correct products configured
- Solution: Add Facebook Login for Business product

## Production Deployment

When ready for production:

1. **Complete App Review**:
   - Go to **"App Review"** in sidebar
   - Request advanced permissions
   - Provide use case documentation
   - Submit demo video
   - Add privacy policy URL

2. **Switch to Live Mode**:
   - After approval, toggle app to **"Live"** mode
   - Update redirect URI to production domain

3. **Add Production URLs**:
   - Update `.env.production` with production domain
   - Add production redirect URI in Facebook Login settings

## API Changes

The code now uses:
- **OAuth URL**: `https://www.facebook.com/v18.0/dialog/oauth` (was `https://api.instagram.com/oauth/authorize`)
- **Token Exchange**: Facebook Graph API endpoints
- **Instagram Access**: Via Facebook Page token

All API calls to Instagram now use Facebook Graph API format:
```
https://graph.facebook.com/v18.0/{instagram-account-id}/...
```

## Benefits of New Approach

✅ Full access to Instagram Business features
✅ Comments API for automation
✅ Messaging API for DMs
✅ Media insights and analytics
✅ Long-lived tokens (60 days, auto-renewable)
✅ Better rate limits for business use
✅ Official Meta-supported flow for business apps

## Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Instagram Business Account Setup](https://help.instagram.com/502981923235522)
