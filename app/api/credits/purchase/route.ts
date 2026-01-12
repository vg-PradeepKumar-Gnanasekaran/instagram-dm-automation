import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Credit packages
const PACKAGES = {
  starter: { credits: 100, price: 9.99, name: 'Starter' },
  growth: { credits: 500, price: 39.99, name: 'Growth' },
  professional: { credits: 1000, price: 69.99, name: 'Professional' },
  enterprise: { credits: 5000, price: 299.99, name: 'Enterprise' },
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { packageId } = body;

    if (!packageId || !PACKAGES[packageId as keyof typeof PACKAGES]) {
      return NextResponse.json({ error: 'Invalid package selected' }, { status: 400 });
    }

    const selectedPackage = PACKAGES[packageId as keyof typeof PACKAGES];

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'PURCHASE',
        amount: selectedPackage.credits,
        price: selectedPackage.price,
        status: 'PENDING',
        description: `Purchase ${selectedPackage.name} package - ${selectedPackage.credits} credits`,
      },
    });

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPackage.name} Package`,
              description: `${selectedPackage.credits} credits for Instagram DM automation`,
            },
            unit_amount: Math.round(selectedPackage.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
      client_reference_id: transaction.id,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        transactionId: transaction.id,
        credits: selectedPackage.credits.toString(),
      },
    });

    // Update transaction with Stripe session ID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase session' },
      { status: 500 }
    );
  }
}
