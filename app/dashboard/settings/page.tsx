'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Instagram,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface InstagramConnection {
  connected: boolean;
  username?: string;
  userId?: string;
  tokenExpiry?: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [instagram, setInstagram] = useState<InstagramConnection>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkInstagramConnection();
  }, []);

  const checkInstagramConnection = async () => {
    try {
      const response = await fetch('/api/instagram/status');
      if (response.ok) {
        const data = await response.json();
        setInstagram(data);
      }
    } catch (error) {
      console.error('Error checking Instagram connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectInstagram = async () => {
    setConnecting(true);
    try {
      // Redirect to Instagram OAuth
      window.location.href = '/api/instagram/connect';
    } catch (error) {
      console.error('Error connecting Instagram:', error);
      setConnecting(false);
    }
  };

  const disconnectInstagram = async () => {
    if (!confirm('Are you sure you want to disconnect your Instagram account?')) {
      return;
    }

    try {
      const response = await fetch('/api/instagram/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setInstagram({ connected: false });
      }
    } catch (error) {
      console.error('Error disconnecting Instagram:', error);
    }
  };

  const isTokenExpiringSoon = () => {
    if (!instagram.tokenExpiry) return false;
    const expiry = new Date(instagram.tokenExpiry);
    const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry < 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your Instagram connection and automation settings
          </p>
        </div>

        {/* Instagram Connection Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Instagram Account</CardTitle>
                  <CardDescription>
                    Connect your Instagram Business or Creator account
                  </CardDescription>
                </div>
              </div>
              {instagram.connected ? (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {instagram.connected ? (
              <>
                {/* Connected Account Info */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900">
                        Connected to @{instagram.username}
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your automation rules can now interact with your Instagram account
                      </p>
                      {instagram.tokenExpiry && (
                        <p className="text-xs text-green-600 mt-2">
                          Token expires: {new Date(instagram.tokenExpiry).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Token Expiry Warning */}
                {isTokenExpiringSoon() && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-900">
                          Token Expiring Soon
                        </h4>
                        <p className="text-sm text-orange-700 mt-1">
                          Your Instagram access token will expire soon. Reconnect to refresh it.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={connectInstagram}
                    variant="outline"
                    disabled={connecting}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Connection
                  </Button>
                  <Button
                    onClick={disconnectInstagram}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Not Connected State */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900">
                        Instagram Account Required
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        To use DM automation, you need to connect an Instagram Business or Creator account
                      </p>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Requirements:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Instagram Business or Creator account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Facebook Page connected to your Instagram</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Meta/Facebook app configured (see setup guide)</span>
                    </li>
                  </ul>
                </div>

                {/* Connect Button */}
                <Button
                  onClick={connectInstagram}
                  disabled={connecting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  {connecting ? 'Connecting...' : 'Connect Instagram Account'}
                </Button>

                {/* Setup Guide Link */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    Need help setting up? Read our setup guide:
                  </p>
                  <a
                    href="/INSTAGRAM_API_SETUP.md"
                    target="_blank"
                    className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    Instagram API Setup Guide
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Instagram Connection Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Authorize Access</h4>
                  <p className="text-sm text-gray-600">
                    You'll be redirected to Instagram to authorize our app to access your account
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Grant Permissions</h4>
                  <p className="text-sm text-gray-600">
                    We'll request permissions to read comments, send messages, and manage your content
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Secure Storage</h4>
                  <p className="text-sm text-gray-600">
                    Your access token is encrypted and stored securely in our database
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Automation Active</h4>
                  <p className="text-sm text-gray-600">
                    Your automation rules will use your token to reply and send DMs on your behalf
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                <strong>Privacy Note:</strong> We only use your Instagram access for the automation features you enable.
                We never post, delete, or modify content without your explicit automation rules.
                You can disconnect at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
