# Razorpay Integration Guide

This application uses **Razorpay** for payment processing, supporting UPI, Cards, Net Banking, Wallets, and more payment methods popular in India.

## Features

- ✅ **UPI Payments** - Google Pay, PhonePe, Paytm, BHIM
- ✅ **Credit/Debit Cards** - Visa, Mastercard, RuPay, Amex
- ✅ **Net Banking** - All major Indian banks
- ✅ **Wallets** - Paytm, Mobikwik, FreeCharge, etc.
- ✅ **EMI Options** - Available for eligible transactions
- ✅ **International Cards** - For global users

## Setup Instructions

### 1. Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. Sign up with your business details
3. Complete KYC verification (required for live mode)
4. Activate your account

### 2. Get API Keys

#### Test Mode (for development):
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Key**
4. Copy your:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

#### Live Mode (for production):
1. Complete KYC and account activation
2. Go to **Settings** → **API Keys**
3. Click **Generate Live Key**
4. Copy your:
   - **Key ID** (starts with `rzp_live_`)
   - **Key Secret**

### 3. Configure Environment Variables

Add to your `.env.local`:

```env
# Payment Gateway
PAYMENT_GATEWAY="razorpay"

# Razorpay Test Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_secret_key_here"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
```

**Important**:
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` must have the `NEXT_PUBLIC_` prefix (used in frontend)
- Never commit the Key Secret to version control
- Keep secrets in `.env.local` (not `.env.example`)

### 4. Set Up Webhooks

Webhooks notify your server about payment events automatically.

1. Go to **Settings** → **Webhooks** in Razorpay Dashboard
2. Click **Add New Webhook**
3. Enter your webhook URL:
   - **Local Development**: Use ngrok or similar tool
     ```bash
     ngrok http 3000
     # Use: https://your-ngrok-url.ngrok.io/api/webhooks/razorpay
     ```
   - **Production**: `https://yourdomain.com/api/webhooks/razorpay`
4. Select events to subscribe:
   - ✅ `payment.authorized`
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `order.paid`
5. Set **Alert Email** for webhook failures
6. Click **Create Webhook**
7. Copy the **Webhook Secret** and add to `.env.local`

### 5. Test Payment Flow

#### Using Test Mode:

**Test Cards:**
```
Successful Payment:
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

**Test UPI:**
```
UPI ID: success@razorpay
(Use this for successful test payments)
```

**Test Net Banking:**
- Select any bank
- Choose "Success" or "Failure" to test different scenarios

#### Test Steps:
1. Run your application: `npm run dev`
2. Navigate to `/dashboard/credits`
3. Click on any package
4. Complete test payment
5. Verify credits are added

### 6. Production Checklist

Before going live:

- [ ] Complete KYC verification
- [ ] Generate live API keys
- [ ] Update environment variables with live keys
- [ ] Configure production webhook URL
- [ ] Test complete payment flow
- [ ] Set up payment notifications
- [ ] Configure settlement account
- [ ] Review pricing and packages
- [ ] Test refund process
- [ ] Monitor first few transactions

## Payment Flow

1. **User selects package** → Frontend calls `/api/credits/purchase-razorpay`
2. **Backend creates order** → Razorpay Order ID generated
3. **Checkout opens** → Razorpay modal with payment options
4. **User completes payment** → Razorpay processes transaction
5. **Frontend verifies** → Calls `/api/credits/verify-razorpay` with signature
6. **Backend validates** → Verifies signature and adds credits
7. **Webhook confirms** → `/api/webhooks/razorpay` receives event (backup)

## Security Best Practices

### Signature Verification

Always verify payment signatures:

```typescript
const crypto = require('crypto');

const generatedSignature = crypto
  .createHmac('sha256', keySecret)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

if (generatedSignature === razorpaySignature) {
  // Payment is genuine
}
```

### Never Trust Frontend

- Always verify on backend
- Check signatures for all payments
- Validate amounts match your database
- Use webhook as backup verification

## Pricing Structure

Current packages with INR pricing:

| Package | Credits | INR Price | USD Price |
|---------|---------|-----------|-----------|
| Starter | 100 | ₹799 | $9.99 |
| Growth | 500 | ₹2,999 | $39.99 |
| Professional | 1,000 | ₹5,499 | $69.99 |
| Enterprise | 5,000 | ₹24,999 | $299.99 |

## Customization

### Update Pricing

Edit `/app/api/credits/purchase-razorpay/route.ts`:

```typescript
const PACKAGES = {
  starter: { credits: 100, price: 799, priceUSD: 9.99, name: 'Starter' },
  // Add more packages or modify existing
};
```

### Change Currency

To support international payments:

```typescript
const razorpayOrder = await razorpay.orders.create({
  amount: selectedPackage.price * 100,
  currency: 'USD', // Change from INR to USD
  // ... other options
});
```

## Troubleshooting

### Payment Fails Immediately

**Issue**: Payment fails right after opening checkout

**Solutions**:
- Verify API keys are correct
- Check if key is for correct mode (test/live)
- Ensure `NEXT_PUBLIC_` prefix for Key ID

### Webhook Not Receiving Events

**Issue**: Credits not added after payment

**Solutions**:
- Check webhook URL is accessible
- Verify webhook secret matches
- Check Razorpay dashboard logs
- Ensure signature verification passes

### Signature Mismatch Error

**Issue**: "Payment verification failed"

**Solutions**:
- Verify Key Secret is correct
- Check order_id and payment_id are passed correctly
- Ensure no extra whitespace in keys

### Credits Not Added

**Issue**: Payment successful but credits not added

**Solutions**:
- Check database connection
- Review transaction status in database
- Check webhook logs
- Verify user authentication

## Monitoring & Logs

### Razorpay Dashboard

1. **Payments** → View all transactions
2. **Settlements** → Track payouts to bank
3. **Disputes** → Handle chargebacks
4. **Analytics** → Monitor metrics

### Application Logs

Check transaction status:
```sql
SELECT * FROM "Transaction"
WHERE "userId" = 'user_id'
ORDER BY "createdAt" DESC;
```

Check webhook logs:
```sql
SELECT * FROM "SystemLog"
WHERE "category" = 'razorpay_webhook'
ORDER BY "createdAt" DESC;
```

## Support

### Razorpay Support
- Email: support@razorpay.com
- Phone: +91-80-68007777
- Dashboard: Live chat available
- Docs: https://razorpay.com/docs/

### Common Links
- [API Documentation](https://razorpay.com/docs/api/)
- [Webhooks Guide](https://razorpay.com/docs/webhooks/)
- [Payment Gateway](https://razorpay.com/docs/payments/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

## Going International

To support both Indian and international customers:

1. Keep Razorpay for Indian users (UPI, etc.)
2. Add Stripe for international payments
3. Detect user location or let them choose
4. Configure both payment gateways
5. Use `PAYMENT_GATEWAY` env variable to toggle

See `STRIPE_SETUP.md` for Stripe integration details.

---

**Note**: This integration is production-ready. Complete KYC and use live keys before launching to customers.
