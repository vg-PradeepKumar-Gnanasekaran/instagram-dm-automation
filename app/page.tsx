import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, MessageCircle, Zap, Shield, TrendingUp, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Automate Your Instagram DMs
            <span className="block text-orange-600 mt-2">Engage Smarter, Not Harder</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automatically send personalized direct messages to users who comment on your posts.
            Build relationships and drive engagement with intelligent automation.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <Card>
            <CardHeader>
              <MessageCircle className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Smart Keyword Matching</CardTitle>
              <CardDescription>
                Trigger DMs based on specific keywords in comments with advanced filtering
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Instant Automation</CardTitle>
              <CardDescription>
                Respond to interested customers immediately while you focus on your business
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Safe & Compliant</CardTitle>
              <CardDescription>
                Built-in rate limiting and spam prevention to keep your account safe
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Track performance with detailed analytics and optimize your campaigns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Schedule & Control</CardTitle>
              <CardDescription>
                Set up rules once and let automation work 24/7 on your behalf
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Easy Setup</CardTitle>
              <CardDescription>
                Connect Instagram, create rules, and start automating in minutes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="font-semibold">Connect Instagram</h3>
              <p className="text-sm text-gray-600">
                Link your Instagram business account securely
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="font-semibold">Create Rules</h3>
              <p className="text-sm text-gray-600">
                Set keywords and conditions to trigger DMs
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="font-semibold">Design Templates</h3>
              <p className="text-sm text-gray-600">
                Craft personalized message templates
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
                4
              </div>
              <h3 className="font-semibold">Auto-Engage</h3>
              <p className="text-sm text-gray-600">
                Let automation handle the rest
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, Credit-Based Pricing</h2>
          <p className="text-gray-600 mb-12">1 Credit = 1 Automated DM Sent | Pay with UPI, Cards & More</p>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold mt-2">₹799</div>
                <div className="text-sm text-gray-500">$9.99</div>
                <CardDescription>100 Credits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Perfect for testing</p>
              </CardContent>
            </Card>

            <Card className="border-orange-600 border-2">
              <CardHeader>
                <CardTitle>Growth</CardTitle>
                <div className="text-3xl font-bold mt-2">₹2,999</div>
                <div className="text-sm text-gray-500">$39.99</div>
                <CardDescription>500 Credits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Most popular</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="text-3xl font-bold mt-2">₹5,499</div>
                <div className="text-sm text-gray-500">$69.99</div>
                <CardDescription>1,000 Credits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">For growing brands</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="text-3xl font-bold mt-2">₹24,999</div>
                <div className="text-sm text-gray-500">$299.99</div>
                <CardDescription>5,000 Credits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Maximum scale</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center bg-orange-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Instagram DMs?</h2>
          <p className="text-gray-600 mb-8">Join thousands of businesses growing with automation</p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
