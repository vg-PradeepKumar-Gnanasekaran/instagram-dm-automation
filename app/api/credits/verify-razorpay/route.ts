import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Verify Razorpay payment signature after successful payment
 * This endpoint is called from frontend after payment completion
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return NextResponse.json(
        { error: 'Missing payment verification details' },
        { status: 400 }
      );
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Invalid signature - possible fraud attempt
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Payment already processed' });
    }

    // Verify the transaction belongs to the current user
    if (transaction.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized transaction' }, { status: 403 });
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        stripePaymentIntentId: razorpay_payment_id, // Store payment ID
      },
    });

    // Add credits to user's account
    const existingCredit = await prisma.credit.findFirst({
      where: { userId: session.user.id },
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
          userId: session.user.id,
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
          userId: session.user.id,
          date: today,
        },
      },
      create: {
        userId: session.user.id,
        date: today,
        creditsPurchased: transaction.amount,
      },
      update: {
        creditsPurchased: {
          increment: transaction.amount,
        },
      },
    });

    // TODO: Send confirmation email
    console.log(`Credits added: ${transaction.amount} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      credits: transaction.amount,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
