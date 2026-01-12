import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Credit packages with INR pricing
const PACKAGES = {
  starter: { credits: 100, price: 799, priceUSD: 9.99, name: 'Starter' },
  growth: { credits: 500, price: 2999, priceUSD: 39.99, name: 'Growth' },
  professional: { credits: 1000, price: 5499, priceUSD: 69.99, name: 'Professional' },
  enterprise: { credits: 5000, price: 24999, priceUSD: 299.99, name: 'Enterprise' },
};

/**
 * Create Razorpay order for credit purchase
 * Supports UPI, Cards, Net Banking, Wallets, and more
 */
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
        price: selectedPackage.price, // INR amount
        status: 'PENDING',
        description: `Purchase ${selectedPackage.name} package - ${selectedPackage.credits} credits`,
      },
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    // Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: selectedPackage.price * 100, // Amount in paise (₹799 = 79900 paise)
      currency: 'INR',
      receipt: transaction.id,
      notes: {
        userId: session.user.id,
        transactionId: transaction.id,
        credits: selectedPackage.credits.toString(),
        packageName: selectedPackage.name,
        userEmail: user?.email || '',
      },
    });

    // Update transaction with Razorpay order ID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        stripeSessionId: razorpayOrder.id, // Reusing this field for Razorpay order ID
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      transactionId: transaction.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
