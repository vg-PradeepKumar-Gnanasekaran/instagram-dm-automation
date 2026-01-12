'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  Power,
  PowerOff,
  Edit,
  Trash2,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  keywords: string[];
  totalSent: number;
  totalFailed: number;
  totalTriggered: number;
  createdAt: string;
}

export default function RulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const getSuccessRate = (sent: number, failed: number) => {
    const total = sent + failed;
    if (total === 0) return 0;
    return Math.round((sent / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading automation rules...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
              <p className="text-gray-600 mt-2">
                Manage your Instagram DM automation rules
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/rules/new')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Rule
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {rules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Rules</p>
                    <p className="text-2xl font-bold">{rules.length}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Rules</p>
                    <p className="text-2xl font-bold">
                      {rules.filter(r => r.isActive).length}
                    </p>
                  </div>
                  <Power className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total DMs Sent</p>
                    <p className="text-2xl font-bold">
                      {rules.reduce((sum, r) => sum + r.totalSent, 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rules List */}
        {rules.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first automation rule to start engaging with your Instagram audience automatically
                </p>
                <Button
                  onClick={() => router.push('/dashboard/rules/new')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle>{rule.name}</CardTitle>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <CardDescription className="mt-2">
                          {rule.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRule(rule.id, rule.isActive)}
                      >
                        {rule.isActive ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/rules/${rule.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Keywords */}
                    <div>
                      <p className="text-sm font-medium mb-2">Trigger Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {rule.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-600">Triggered</p>
                        <p className="text-lg font-semibold">{rule.totalTriggered}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">DMs Sent</p>
                        <p className="text-lg font-semibold text-green-600">
                          {rule.totalSent}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Failed</p>
                        <p className="text-lg font-semibold text-red-600">
                          {rule.totalFailed}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Success Rate</p>
                        <p className="text-lg font-semibold">
                          {getSuccessRate(rule.totalSent, rule.totalFailed)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  Connect Your Instagram Account
                </h4>
                <p className="text-sm text-blue-800">
                  To use these automation rules, you need to connect your Instagram account first.
                  Go to Settings to connect via Facebook/Meta Business integration.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push('/dashboard/settings')}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
