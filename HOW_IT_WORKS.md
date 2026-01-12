# How Instagram DM Automation Works

## Complete Flow Explanation

### 1. User Authentication (Your App)

**What happens:**
- User signs up/logs in to YOUR application
- Creates an account in YOUR database
- Gets a session token for YOUR app

**Why:**
- This is to manage users of your automation service
- Tracks who owns which automation rules
- Manages credits and billing

### 2. Instagram OAuth Connection

**What happens:**
- User clicks "Connect Instagram" in settings
- Gets redirected to Instagram/Facebook OAuth page
- Logs in with THEIR Instagram credentials
- Authorizes YOUR app to access THEIR account
- Instagram gives YOUR app an access token

**Why:**
- Your app needs permission to act on their behalf
- The access token allows your app to:
  - Read comments on their posts
  - Reply to comments as them
  - Send DMs as them
  - Access their profile info

**Important:**
- The user is NOT logging into Instagram in your app
- They're authorizing your app to use Instagram API with their account
- The token is stored encrypted in your database

### 3. Creating Automation Rules

**What happens:**
- User creates automation rules (keywords, messages, etc.)
- Rules are stored in YOUR database
- Linked to their user account

**Example Rule:**
```
When someone comments "interested" or "price":
  → Reply: "Check your DMs! 📩"
  → Send DM: "Hi! Here's our pricing..."
```

### 4. The Automation Engine (Background Worker)

**What happens:**
- Your server runs a background job (cron/worker)
- For each user with active rules:
  1. Fetch their Instagram access token from database
  2. Use Instagram API to check for new comments
  3. Match comments against their automation rules
  4. If keyword matches:
     - Use their token to reply to comment
     - Use their token to send DM
  5. Log the activity in database

**Technical Flow:**
```
Every 5 minutes (or real-time with webhooks):
├── Get all active automation rules
├── For each rule:
│   ├── Get user's Instagram token
│   ├── Call Instagram API (using their token)
│   ├── Fetch recent comments on their posts
│   ├── Check if comment matches keywords
│   ├── If match:
│   │   ├── Reply to comment (as them)
│   │   ├── Send DM (as them)
│   │   └── Deduct credits
│   └── Log activity
└── Sleep until next cycle
```

## Instagram API Integration

### Required Components

1. **Meta/Facebook Developer App**
   - Create app at https://developers.facebook.com
   - Add Instagram product
   - Configure OAuth redirect URLs

2. **Instagram Business/Creator Account**
   - Personal accounts won't work
   - Must be connected to Facebook Page
   - User must convert their account

3. **Access Token**
   - Obtained through OAuth flow
   - Stored encrypted in database
   - Expires after 60 days (needs refresh)
   - Used for all API calls

### API Endpoints Used

1. **GET Comments**
   ```
   GET /{media-id}/comments
   Access token: User's token
   Returns: List of comments on their post
   ```

2. **POST Reply to Comment**
   ```
   POST /{comment-id}/replies
   Body: { message: "Reply text" }
   Access token: User's token
   Effect: Replies as the user
   ```

3. **POST Send DM**
   ```
   POST /{user-id}/messages
   Body: { message: "DM text" }
   Access token: User's token
   Effect: Sends DM as the user
   ```

## Security & Privacy

### Data Storage

**What you store:**
- User's app account (email, password)
- Instagram username and user ID
- Instagram access token (ENCRYPTED)
- Automation rules they create
- Activity logs (who they messaged, when)

**What you DON'T store:**
- Instagram password
- Instagram posts content
- Private messages content (unless for logging)

### Token Security

```javascript
// Good practice - encryption
const encryptedToken = encrypt(instagramToken, SECRET_KEY);
await prisma.user.update({
  data: { instagramToken: encryptedToken }
});

// When using
const decryptedToken = decrypt(user.instagramToken, SECRET_KEY);
const response = await fetch('https://graph.instagram.com/...', {
  headers: { Authorization: `Bearer ${decryptedToken}` }
});
```

### User Control

Users can:
- Disconnect Instagram anytime
- Delete automation rules
- View all activity logs
- See exactly what messages were sent

## Rate Limits & Best Practices

### Instagram API Limits

- **200 API calls/hour per user**
- **10,000 calls/day per app**

### Recommended Approach

1. **Batch Processing**
   - Don't check every second
   - Process in 5-15 minute intervals
   - Only check posts with recent activity

2. **Smart Filtering**
   - Only process comments from last 24 hours
   - Skip comments already processed
   - Cache results where possible

3. **Cooldown Periods**
   - Don't DM same user multiple times
   - Implement 24-hour cooldown per recipient
   - Respect Instagram's spam policies

## Production Deployment

### Before Going Live

1. **App Review (Meta)**
   - Submit app for review
   - Provide use case explanation
   - Demo video required
   - Privacy policy required
   - Terms of service required

2. **Webhook Setup** (Optional but recommended)
   - Real-time comment notifications
   - More efficient than polling
   - Requires public HTTPS endpoint

3. **Infrastructure**
   - Reliable background worker
   - Redis for job queue
   - Error monitoring (Sentry)
   - Rate limit handling

### Scaling Considerations

- One token per user (decentralized)
- Each user has their own rate limit
- Load distributes automatically
- Can handle thousands of users

## Common Issues & Solutions

### "Token Expired"
**Problem:** Access tokens expire after 60 days
**Solution:**
- Implement token refresh flow
- Notify users before expiration
- Auto-refresh if possible

### "Rate Limited"
**Problem:** Hit Instagram API rate limits
**Solution:**
- Implement exponential backoff
- Reduce polling frequency
- Show clear error to user

### "Permission Denied"
**Problem:** Missing required permissions
**Solution:**
- Check app permissions in Meta dashboard
- User needs to reconnect and grant all permissions
- Update OAuth scopes if needed

## Next Steps

1. **Set up Meta App** (see INSTAGRAM_API_SETUP.md)
2. **Test OAuth flow** (connect test Instagram account)
3. **Implement background worker** (process automation rules)
4. **Add webhook support** (for real-time processing)
5. **Submit for review** (for production use)

## Support & Resources

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Messaging API Docs](https://developers.facebook.com/docs/messenger-platform/instagram)
- [OAuth Flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
- [Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)
