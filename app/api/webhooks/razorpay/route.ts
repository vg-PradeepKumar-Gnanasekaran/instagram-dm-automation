import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Razorpay Webhook Handler
 * Handles payment events from Razorpay
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.authorized':
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentId = payment.id;

        // Find transaction by order ID
        const transaction = await prisma.transaction.findFirst({
          where: { stripeSessionId: orderId }, // We stored order_id here
        });

        if (!transaction) {
          console.error('Transaction not found for order:', orderId);
          break;
        }

        // Skip if already completed
        if (transaction.status === 'COMPLETED') {
          break;
        }

        // Update transaction status
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            stripePaymentIntentId: paymentId,
          },
        });

        // Add credits to user's account
        const existingCredit = await prisma.credit.findFirst({
          where: { userId: transaction.userId },
          orderBy: { createdAt: 'desc' },
        });

        if (existingCredit) {
          await prisma.credit.update({
            where: { id: existingCredit.id },
            data: {
              amount: existingCredit.amount + transaction.amount,
            },
          });
        } else {
          await prisma.credit.create({
            data: {
              userId: transaction.userId,
              amount: transaction.amount,
            },
          });
        }

        // Update analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.analyticsDaily.upsert({
          where: {
            userId_date: {
              userId: transaction.userId,
              date: today,
            },
          },
          create: {
            userId: transaction.userId,
            date: today,
            creditsPurchased: transaction.amount,
          },
          update: {
            creditsPurchased: {
              increment: transaction.amount,
            },
          },
        });

        console.log(`Credits added: ${transaction.amount} for user ${transaction.userId}`);
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        const transaction = await prisma.transaction.findFirst({
          where: { stripeSessionId: orderId },
        });

        if (transaction && transaction.status === 'PENDING') {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'FAILED' },
          });
        }
        break;
      }

      case 'order.paid': {
        const order = event.payload.order.entity;
        console.log('Order paid:', order.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
