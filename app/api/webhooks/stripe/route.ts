import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const transactionId = session.metadata?.transactionId;
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || '0');

        if (!transactionId || !userId || !credits) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Update transaction status
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            stripePaymentIntentId: session.payment_intent as string,
          },
        });

        // Add credits to user's account
        const existingCredit = await prisma.credit.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (existingCredit) {
          await prisma.credit.update({
            where: { id: existingCredit.id },
            data: {
              amount: existingCredit.amount + credits,
            },
          });
        } else {
          await prisma.credit.create({
            data: {
              userId,
              amount: credits,
            },
          });
        }

        // Update analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.analyticsDaily.upsert({
          where: {
            userId_date: {
              userId,
              date: today,
            },
          },
          create: {
            userId,
            date: today,
            creditsPurchased: credits,
          },
          update: {
            creditsPurchased: {
              increment: credits,
            },
          },
        });

        // TODO: Send confirmation email
        console.log(`Credits added: ${credits} for user ${userId}`);
        break;
      }

      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const transactionId = session.metadata?.transactionId;

        if (transactionId) {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'FAILED' },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
