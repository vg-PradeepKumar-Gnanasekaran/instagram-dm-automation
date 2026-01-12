# Instagram DM Automation Platform

A comprehensive web application that automatically sends direct messages to Instagram users based on their comments and interactions, with a credit-based payment system.

## Features

### Core Functionality
- **User Authentication**: Secure sign up/sign in with email verification
- **Instagram Integration**: OAuth integration with Instagram Graph API
- **Credit System**: Purchase credits and pay-per-DM sent
- **Automation Rules**: Create complex rules with keyword matching and filters
- **Message Templates**: Reusable templates with personalization variables
- **Background Processing**: Queue-based DM sending with Bull and Redis
- **Analytics Dashboard**: Real-time metrics and performance tracking
- **Activity Logging**: Detailed logs of all DM activities
- **Rate Limiting**: Built-in safety features to prevent spam

### Technical Highlights
- Next.js 14 with App Router
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- Stripe for payment processing
- Bull + Redis for job queuing
- Tailwind CSS + shadcn/ui for UI
- Instagram Graph API integration

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or Supabase)
- Redis instance (local or Upstash)
- Instagram Business Account
- Stripe Account

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**

   Copy `.env.example` to `.env.local` and configure:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/instagram_dm_automation"

   # Supabase (if using)
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

   # Instagram API
   INSTAGRAM_APP_ID="your-app-id"
   INSTAGRAM_APP_SECRET="your-app-secret"
   INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/instagram/callback"

   # Stripe
   STRIPE_PUBLIC_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # Redis
   REDIS_URL="redis://localhost:6379"
   ```

3. **Generate NEXTAUTH_SECRET**
   ```bash
   openssl rand -base64 32
   ```

4. **Set Up Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Instagram API Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app with Instagram Graph API
3. Configure OAuth redirect URI: `http://localhost:3000/api/instagram/callback`
4. Required scopes: `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`

### Razorpay Setup (Recommended for India)

1. Create account at [Razorpay](https://razorpay.com)
2. Get API keys from Dashboard (Settings → API Keys)
3. Set up webhook: `https://yourdomain.com/api/webhooks/razorpay`
4. Subscribe to: `payment.captured`, `payment.failed`, `order.paid`
5. See [RAZORPAY_SETUP.md](./RAZORPAY_SETUP.md) for detailed guide

**Payment Methods**: UPI, Cards, Net Banking, Wallets

### Stripe Setup (Optional - for International)

1. Create account at [Stripe](https://stripe.com)
2. Get API keys from Dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Subscribe to: `checkout.session.completed`, `payment_intent.payment_failed`

## Project Structure

```
instagram-dm-automation/
├── app/
│   ├── api/                    # API routes
│   ├── dashboard/             # Dashboard pages
│   └── auth/                  # Auth pages
├── components/ui/             # shadcn/ui components
├── lib/                       # Utility libraries
├── prisma/                    # Database schema
└── types/                     # TypeScript definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify-email` - Email verification

### Credits
- `GET /api/credits/balance` - Get credit balance
- `POST /api/credits/purchase` - Purchase credits

### Automation Rules
- `GET /api/rules` - List all rules
- `POST /api/rules` - Create new rule
- `PATCH /api/rules/[id]` - Update rule
- `DELETE /api/rules/[id]` - Delete rule

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/activity` - Activity log

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Setup

Use Supabase or Railway PostgreSQL:
```bash
npx prisma db push
```

## Development Commands

```bash
# Run development server
npm run dev

# Prisma Studio
npx prisma studio

# Database migrations
npx prisma migrate dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## Security Considerations

1. Never commit `.env.local`
2. Encrypt Instagram tokens in production
3. Use HTTPS in production
4. Regular security audits

## License

Proprietary - All rights reserved

---

Built with Next.js, Prisma, NextAuth.js, Tailwind CSS, and shadcn/ui.
