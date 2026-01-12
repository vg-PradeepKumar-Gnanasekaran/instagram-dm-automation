'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface RazorpayCheckoutProps {
  packageId: 'starter' | 'growth' | 'professional' | 'enterprise';
  packageName: string;
  credits: number;
  price: number;
  priceINR: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayCheckout({
  packageId,
  packageName,
  credits,
  price,
  priceINR,
  onSuccess,
  onError,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Create order on backend
      const response = await fetch('/api/credits/purchase-razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const { orderId, amount, currency, transactionId, keyId } = await response.json();

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Instagram DM Automation',
        description: `${packageName} Package - ${credits} Credits`,
        order_id: orderId,
        handler: async function (response: any) {
          // Payment successful - verify on backend
          try {
            const verifyResponse = await fetch('/api/credits/verify-razorpay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: transactionId,
              }),
            });

            if (verifyResponse.ok) {
              if (onSuccess) {
                onSuccess();
              } else {
                router.push('/dashboard?payment=success');
              }
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            if (onError) {
              onError('Payment verification failed');
            }
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        notes: {
          packageId,
          credits: credits.toString(),
        },
        theme: {
          color: '#EA580C', // Orange-600
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            if (onError) {
              onError('Payment cancelled');
            }
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Payment failed');
      }
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-orange-600 hover:bg-orange-700"
    >
      {loading ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Processing...
        </>
      ) : (
        <>Pay ₹{priceINR} (${price})</>
      )}
    </Button>
  );
}
