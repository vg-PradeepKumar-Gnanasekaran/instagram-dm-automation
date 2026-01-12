'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RazorpayCheckout from '@/components/RazorpayCheckout';
import { CheckCircle2, Coins, Sparkles, TrendingUp, Zap } from 'lucide-react';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    priceUSD: 9.99,
    priceINR: 799,
    description: 'Perfect for testing',
    features: ['100 Automated DMs', 'Basic Analytics', 'Email Support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    credits: 500,
    priceUSD: 39.99,
    priceINR: 2999,
    description: 'Most popular choice',
    features: ['500 Automated DMs', 'Advanced Analytics', 'Priority Support', 'A/B Testing'],
    popular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 1000,
    priceUSD: 69.99,
    priceINR: 5499,
    description: 'For growing brands',
    features: ['1,000 Automated DMs', 'Full Analytics Suite', 'Priority Support', 'Custom Templates'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 5000,
    priceUSD: 299.99,
    priceINR: 24999,
    description: 'Maximum scale',
    features: ['5,000 Automated DMs', 'Enterprise Analytics', 'Dedicated Support', 'API Access'],
  },
];

export default function CreditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated') {
      fetchBalance();
    }
  }, [status, router]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      // Show success notification
      setTimeout(() => {
        router.replace('/dashboard/credits');
        fetchBalance(); // Refresh balance
      }, 2000);
    }
  }, [searchParams, router]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const paymentSuccess = searchParams.get('payment') === 'success';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Purchase Credits</h1>
              <p className="text-gray-600">Choose a package to power your automation</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Balance</p>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold">{balance || 0}</span>
                <span className="text-gray-600">credits</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {paymentSuccess && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Payment Successful!</p>
              <p className="text-sm text-green-700">Your credits have been added to your account.</p>
            </div>
          </div>
        )}

        {/* Payment Method Info */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Multiple Payment Options</p>
              <p className="text-sm text-blue-700">
                Pay with UPI, Cards, Net Banking, or Wallets via Razorpay
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${
                pkg.popular ? 'border-orange-500 border-2 shadow-lg' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-600 text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold">₹{pkg.priceINR}</div>
                  <div className="text-sm text-gray-500">${pkg.priceUSD} USD</div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold text-orange-600">
                      {pkg.credits} Credits
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <RazorpayCheckout
                  packageId={pkg.id as any}
                  packageName={pkg.name}
                  credits={pkg.credits}
                  price={pkg.priceUSD}
                  priceINR={pkg.priceINR}
                  onSuccess={() => {
                    router.push('/dashboard/credits?payment=success');
                    fetchBalance();
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle className="text-lg">No Expiry</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Credits never expire. Use them whenever you need.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Instant Activation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Credits are added immediately after payment confirmation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                All payments are processed securely through Razorpay.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg p-6 border">
          <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">What is 1 credit?</h3>
              <p className="text-sm text-gray-600">
                1 credit = 1 automated direct message sent on Instagram. Every time our system
                sends a DM on your behalf, 1 credit is deducted.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Do credits expire?</h3>
              <p className="text-sm text-gray-600">
                No, your credits never expire. Use them at your own pace.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Can I get a refund?</h3>
              <p className="text-sm text-gray-600">
                Credits are non-refundable once purchased. However, we offer full support to
                ensure you get the most value from your credits.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">What payment methods are accepted?</h3>
              <p className="text-sm text-gray-600">
                We accept UPI, Credit/Debit Cards, Net Banking, and popular wallets through
                Razorpay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
