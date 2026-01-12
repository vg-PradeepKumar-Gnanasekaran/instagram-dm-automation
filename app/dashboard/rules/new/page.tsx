'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Reply,
  Sparkles,
  ArrowLeft,
  Check,
  Zap
} from 'lucide-react';

// Pre-built templates
const templates = [
  {
    id: 'comment-reply',
    name: 'Comment Reply Automator',
    description: 'Automatically reply to comments on your posts with personalized messages',
    icon: Reply,
    color: 'bg-blue-500',
    keywords: ['thank', 'thanks', 'love', 'amazing', 'great'],
    message: 'Thank you so much! 🙏 We really appreciate your support!',
    targetType: 'ALL_POSTS',
    mustBeFollower: true,
  },
  {
    id: 'comment-dm-combo',
    name: 'Comment + DM Combo',
    description: 'Reply to comment AND send a personalized DM to engage deeper',
    icon: MessageCircle,
    color: 'bg-purple-500',
    keywords: ['interested', 'info', 'details', 'price', 'how'],
    message: 'Hi! 👋 Thanks for your interest! I\'ve sent you a DM with all the details you need. Check your messages! 📩',
    dmMessage: 'Hey there! 🌟\n\nI saw your comment and wanted to personally reach out! Here\'s everything you need to know:\n\n✨ [Your details here]\n\nFeel free to ask any questions!',
    targetType: 'ALL_POSTS',
    mustBeFollower: false,
  },
  {
    id: 'product-inquiry',
    name: 'Product Inquiry Handler',
    description: 'Auto-respond to product questions and guide to purchase',
    icon: Sparkles,
    color: 'bg-green-500',
    keywords: ['buy', 'purchase', 'order', 'available', 'stock'],
    message: 'Interested in this? 🛍️ Check your DMs for exclusive details!',
    dmMessage: '🎉 Excited you\'re interested!\n\n📦 Product Details:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n💰 Special Offer: [Your offer]\n\n🔗 Order here: [Your link]\n\nQuestions? Just reply!',
    targetType: 'ALL_POSTS',
    mustBeFollower: false,
  },
  {
    id: 'engagement-booster',
    name: 'Engagement Booster',
    description: 'Build relationships by responding to engaged followers',
    icon: Zap,
    color: 'bg-orange-500',
    keywords: ['awesome', 'cool', 'wow', 'love this', 'amazing'],
    message: '❤️ Your support means everything! Sent you something special in DM!',
    dmMessage: 'Hey! 🌟\n\nJust wanted to say thanks for being such an engaged follower! 🙌\n\nHere\'s something exclusive for you:\n\n🎁 [Exclusive content/offer]\n\nYou\'re awesome! Keep engaging! 🚀',
    targetType: 'ALL_POSTS',
    mustBeFollower: true,
  },
];

export default function NewRulePage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: '',
    message: '',
    dmMessage: '',
    targetType: 'ALL_POSTS',
    mustBeFollower: true,
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData({
        name: template.name,
        description: template.description,
        keywords: template.keywords.join(', '),
        message: template.message,
        dmMessage: template.dmMessage || '',
        targetType: template.targetType,
        mustBeFollower: template.mustBeFollower,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);

      const ruleData = {
        name: formData.name,
        description: formData.description,
        keywords,
        targetType: formData.targetType,
        mustBeFollower: formData.mustBeFollower,
        keywordLogic: 'OR',
        caseSensitive: false,
        cooldownHours: 24,
        maxDmsPerDay: 50,
      };

      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        router.push('/dashboard/rules');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create rule');
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create automation rule');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Create Automation Rule</h1>
          <p className="text-gray-600 mt-2">
            Choose a template or create a custom automation rule
          </p>
        </div>

        {/* Templates Section */}
        {!selectedTemplate && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-orange-600" />
              Pre-Built Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-500"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`${template.color} p-3 rounded-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant="secondary">Popular</Badge>
                      </div>
                      <CardTitle className="mt-4">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Triggers on:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.keywords.slice(0, 3).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {template.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.keywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Section */}
        {selectedTemplate && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configure Your Automation</CardTitle>
                  <CardDescription>
                    Customize the template to match your needs
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Change Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rule Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Thank You Reply Bot"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this automation do?"
                  />
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <Label htmlFor="keywords">
                    Trigger Keywords *
                    <span className="text-sm text-gray-500 ml-2">(comma-separated)</span>
                  </Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="thank, thanks, love, amazing"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    The automation will trigger when comments contain any of these words
                  </p>
                </div>

                {/* Comment Reply Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Comment Reply Message *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Your automated reply to the comment..."
                    rows={3}
                    required
                  />
                </div>

                {/* DM Message (if applicable) */}
                {formData.dmMessage && (
                  <div className="space-y-2">
                    <Label htmlFor="dmMessage">
                      DM Message *
                      <Badge variant="secondary" className="ml-2">Sent in Direct Message</Badge>
                    </Label>
                    <Textarea
                      id="dmMessage"
                      value={formData.dmMessage}
                      onChange={(e) => setFormData({ ...formData, dmMessage: e.target.value })}
                      placeholder="Your personalized DM message..."
                      rows={6}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      💡 Tip: Use emojis and personal touches to increase engagement!
                    </p>
                  </div>
                )}

                {/* Settings */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Only Reply to Followers</Label>
                        <p className="text-xs text-gray-500">
                          Automation will only trigger for users who follow you
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.mustBeFollower}
                        onChange={(e) => setFormData({ ...formData, mustBeFollower: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {loading ? (
                      'Creating...'
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Create Automation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
