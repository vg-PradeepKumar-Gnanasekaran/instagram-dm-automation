'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorkflowBuilder } from '@/components/workflow/workflow-builder';
import {
  ArrowLeft,
  Save,
  Loader2,
  LayoutTemplate,
  Wrench,
} from 'lucide-react';

export default function EditRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'template' | 'advanced'>('template');

  // Rule data
  const [ruleData, setRuleData] = useState<any>(null);

  // Template mode form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: '',
    message: '',
    dmMessage: '',
    targetType: 'ALL_POSTS',
    mustBeFollower: true,
  });

  // Load existing rule
  useEffect(() => {
    const fetchRule = async () => {
      try {
        const response = await fetch(`/api/rules/${ruleId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch rule');
        }

        const data = await response.json();
        const rule = data.rule;

        setRuleData(rule);

        // Determine mode based on whether workflow exists
        if (rule.workflow && Array.isArray(rule.workflow)) {
          setMode('advanced');
        } else {
          setMode('template');
          setFormData({
            name: rule.name || '',
            description: rule.description || '',
            keywords: rule.keywords?.join(', ') || '',
            message: rule.messageTemplate?.content || '',
            dmMessage: '',
            targetType: rule.targetType || 'ALL_POSTS',
            mustBeFollower: rule.mustBeFollower ?? true,
          });
        }
      } catch (err) {
        console.error('Error fetching rule:', err);
        setError('Failed to load rule');
      } finally {
        setLoading(false);
      }
    };

    fetchRule();
  }, [ruleId]);

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);

      const updateData = {
        name: formData.name,
        description: formData.description,
        keywords,
        targetType: formData.targetType,
        mustBeFollower: formData.mustBeFollower,
        keywordLogic: 'OR',
        caseSensitive: false,
      };

      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push('/dashboard/rules');
      } else {
        alert('Failed to update rule');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update rule');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkflowSave = async (nodes: any[]) => {
    setSaving(true);
    try {
      const updateData = {
        name: formData.name || ruleData.name || 'Advanced Workflow',
        description: 'Custom workflow automation',
        workflow: nodes,
        targetType: 'ALL_POSTS',
        isActive: ruleData.isActive,
      };

      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push('/dashboard/rules');
      } else {
        alert('Failed to update workflow');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update workflow');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading rule...</span>
        </div>
      </div>
    );
  }

  if (error || !ruleData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            {error || 'Rule not found'}
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/rules')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rules
          </Button>
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
            onClick={() => router.push('/dashboard/rules')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rules
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Automation Rule</h1>
          <p className="text-gray-600 mt-2">
            Modify your automation rule configuration
          </p>
        </div>

        {/* Mode Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('template')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  mode === 'template'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <LayoutTemplate
                    className={`h-8 w-8 ${
                      mode === 'template' ? 'text-orange-600' : 'text-gray-400'
                    }`}
                  />
                  <h3 className="font-semibold">Template Mode</h3>
                  <p className="text-sm text-gray-600">
                    Simple keyword-based automation
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode('advanced')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  mode === 'advanced'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <Wrench
                    className={`h-8 w-8 ${
                      mode === 'advanced' ? 'text-orange-600' : 'text-gray-400'
                    }`}
                  />
                  <h3 className="font-semibold">Advanced Mode</h3>
                  <p className="text-sm text-gray-600">
                    Complex workflows with conditions
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Template Mode */}
        {mode === 'template' && (
          <Card>
            <CardHeader>
              <CardTitle>Rule Configuration</CardTitle>
              <CardDescription>Update your automation rule settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trigger Keywords *</Label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="thank, thanks, love"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Comma-separated keywords that will trigger this rule
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Reply Message *</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/rules')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Advanced Workflow Builder */}
        {mode === 'advanced' && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Custom Workflow</CardTitle>
              <CardDescription>
                Modify your automation workflow with multiple triggers, conditions, and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div>
                  <Label>Workflow Name *</Label>
                  <Input
                    value={formData.name || ruleData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Custom Workflow"
                  />
                </div>
              </div>

              <WorkflowBuilder
                onSave={handleWorkflowSave}
                initialWorkflow={ruleData.workflow || []}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
