'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  PlusCircle,
  Instagram,
  AlertCircle,
} from 'lucide-react';

interface DashboardData {
  creditBalance: number;
  activeRulesCount: number;
  dmsSentToday: number;
  dmsSentThisWeek: number;
  dmsSentThisMonth: number;
  successRate: number;
  dailyAnalytics: any[];
  recentActivity: any[];
  topRules: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {session.user.name || 'User'}!</h1>
              <p className="text-gray-600">Here's what's happening with your automation</p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/rules/new')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Credit Balance
              </CardTitle>
              <Coins className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.creditBalance || 0}</div>
              <Button
                variant="link"
                className="text-orange-600 px-0 text-sm mt-2"
                onClick={() => router.push('/dashboard/credits')}
              >
                Add Credits
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Rules
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.activeRulesCount || 0}</div>
              <p className="text-xs text-gray-500 mt-2">Automation rules running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Messages Sent
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.dmsSentToday || 0}</div>
              <p className="text-xs text-gray-500 mt-2">
                {data?.dmsSentThisWeek || 0} this week · {data?.dmsSentThisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Success Rate
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.successRate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-gray-500 mt-2">Delivery success rate today</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest automated messages</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {data.recentActivity.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Instagram className="h-8 w-8 text-pink-600" />
                        <div>
                          <p className="text-sm font-medium">@{activity.recipientUsername}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={activity.status === 'SENT' ? 'default' : 'destructive'}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No activity yet</p>
                  <p className="text-sm">Create a rule to start automating</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Rules</CardTitle>
              <CardDescription>Your most active automation rules</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.topRules && data.topRules.length > 0 ? (
                <div className="space-y-4">
                  {data.topRules.map((rule: any) => (
                    <div key={rule.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{rule.name}</p>
                        <p className="text-xs text-gray-500">
                          {rule.totalSent} sent · {rule.totalFailed} failed
                        </p>
                      </div>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No rules created yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard/rules/new')}
                  >
                    Create Your First Rule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/rules')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                Manage Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View and edit your automation rules
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/templates')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                Message Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create and manage message templates
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/activity')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View detailed activity history
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
