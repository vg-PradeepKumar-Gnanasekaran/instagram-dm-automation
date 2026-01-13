'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  MessageCircle,
  Send,
  GitBranch,
  Users,
  Hash,
  ArrowRight,
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  config: any;
}

interface WorkflowBuilderProps {
  onSave: (workflow: WorkflowNode[]) => void;
  initialWorkflow?: WorkflowNode[];
}

export function WorkflowBuilder({ onSave, initialWorkflow = [] }: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(
    initialWorkflow.length > 0
      ? initialWorkflow
      : [{ id: '1', type: 'trigger', config: { type: 'comment_contains', keywords: [] } }]
  );

  const addNode = (type: 'trigger' | 'condition' | 'action') => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type,
      config: getDefaultConfig(type),
    };
    setNodes([...nodes, newNode]);
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter((node) => node.id !== id));
  };

  const updateNode = (id: string, config: any) => {
    setNodes(
      nodes.map((node) => (node.id === id ? { ...node, config: { ...node.config, ...config } } : node))
    );
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'trigger':
        return { type: 'comment_contains', keywords: [] };
      case 'condition':
        return { type: 'is_following', action: 'continue' };
      case 'action':
        return { type: 'reply_comment', message: '' };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-4">
      {/* Workflow Nodes */}
      <div className="space-y-4">
        {nodes.map((node, index) => (
          <div key={node.id} className="relative">
            {/* Connector Arrow */}
            {index > 0 && (
              <div className="flex justify-center py-2">
                <ArrowRight className="h-6 w-6 text-gray-400 rotate-90" />
              </div>
            )}

            {/* Node Card */}
            <Card className={`border-2 ${getNodeBorderColor(node.type)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(node.type)}
                    <CardTitle className="text-sm font-medium capitalize">
                      {node.type}
                    </CardTitle>
                  </div>
                  {nodes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNode(node.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {node.type === 'trigger' && (
                  <TriggerConfig config={node.config} onChange={(c) => updateNode(node.id, c)} />
                )}
                {node.type === 'condition' && (
                  <ConditionConfig config={node.config} onChange={(c) => updateNode(node.id, c)} />
                )}
                {node.type === 'action' && (
                  <ActionConfig config={node.config} onChange={(c) => updateNode(node.id, c)} />
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Add Node Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => addNode('trigger')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Trigger
        </Button>
        <Button
          variant="outline"
          onClick={() => addNode('condition')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Condition
        </Button>
        <Button
          variant="outline"
          onClick={() => addNode('action')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Action
        </Button>
      </div>

      {/* Save Button */}
      <Button
        onClick={() => onSave(nodes)}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        Save Workflow
      </Button>
    </div>
  );
}

// Trigger Configuration
function TriggerConfig({ config, onChange }: any) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Trigger Type</Label>
        <Select value={config.type} onValueChange={(value) => onChange({ type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comment_contains">Comment Contains Keywords</SelectItem>
            <SelectItem value="comment_from_user">Comment From Specific User</SelectItem>
            <SelectItem value="new_follower">New Follower</SelectItem>
            <SelectItem value="dm_received">DM Received</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.type === 'comment_contains' && (
        <div>
          <Label className="text-xs">Keywords (comma-separated)</Label>
          <Input
            value={config.keywords?.join(', ') || ''}
            onChange={(e) =>
              onChange({ keywords: e.target.value.split(',').map((k) => k.trim()) })
            }
            placeholder="interested, price, info"
          />
          <p className="text-xs text-gray-500 mt-1">
            Trigger when comment contains ANY of these words
          </p>
        </div>
      )}

      {config.type === 'comment_from_user' && (
        <div>
          <Label className="text-xs">Username</Label>
          <Input
            value={config.username || ''}
            onChange={(e) => onChange({ username: e.target.value })}
            placeholder="@username"
          />
        </div>
      )}
    </div>
  );
}

// Condition Configuration
function ConditionConfig({ config, onChange }: any) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Condition Type</Label>
        <Select value={config.type} onValueChange={(value) => onChange({ type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="is_following">Is Following Me</SelectItem>
            <SelectItem value="not_following">Not Following Me</SelectItem>
            <SelectItem value="has_min_followers">Has Minimum Followers</SelectItem>
            <SelectItem value="account_age">Account Age</SelectItem>
            <SelectItem value="comment_length">Comment Length</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.type === 'has_min_followers' && (
        <div>
          <Label className="text-xs">Minimum Followers</Label>
          <Input
            type="number"
            value={config.minFollowers || ''}
            onChange={(e) => onChange({ minFollowers: parseInt(e.target.value) })}
            placeholder="100"
          />
        </div>
      )}

      {config.type === 'account_age' && (
        <div>
          <Label className="text-xs">Minimum Account Age (days)</Label>
          <Input
            type="number"
            value={config.minAgeDays || ''}
            onChange={(e) => onChange({ minAgeDays: parseInt(e.target.value) })}
            placeholder="30"
          />
        </div>
      )}

      {config.type === 'comment_length' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Min Length</Label>
            <Input
              type="number"
              value={config.minLength || ''}
              onChange={(e) => onChange({ minLength: parseInt(e.target.value) })}
              placeholder="10"
            />
          </div>
          <div>
            <Label className="text-xs">Max Length</Label>
            <Input
              type="number"
              value={config.maxLength || ''}
              onChange={(e) => onChange({ maxLength: parseInt(e.target.value) })}
              placeholder="500"
            />
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs">If Condition Fails</Label>
        <Select
          value={config.action || 'stop'}
          onValueChange={(value) => onChange({ action: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stop">Stop Workflow</SelectItem>
            <SelectItem value="continue">Continue Anyway</SelectItem>
            <SelectItem value="alternative">Use Alternative Action</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.action === 'alternative' && (
        <div>
          <Label className="text-xs">Alternative Message</Label>
          <Textarea
            value={config.alternativeMessage || ''}
            onChange={(e) => onChange({ alternativeMessage: e.target.value })}
            placeholder="Custom message if condition fails..."
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

// Action Configuration
function ActionConfig({ config, onChange }: any) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Action Type</Label>
        <Select value={config.type} onValueChange={(value) => onChange({ type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reply_comment">Reply to Comment</SelectItem>
            <SelectItem value="send_dm">Send Direct Message</SelectItem>
            <SelectItem value="like_comment">Like Comment</SelectItem>
            <SelectItem value="tag_user">Tag User in Post</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(config.type === 'reply_comment' || config.type === 'send_dm') && (
        <div>
          <Label className="text-xs">
            {config.type === 'reply_comment' ? 'Reply Message' : 'DM Message'}
          </Label>
          <Textarea
            value={config.message || ''}
            onChange={(e) => onChange({ message: e.target.value })}
            placeholder="Your automated message..."
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            Use {'{'}username{'}'} to personalize
          </p>
        </div>
      )}

      {config.type === 'tag_user' && (
        <div>
          <Label className="text-xs">Post Caption</Label>
          <Textarea
            value={config.caption || ''}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Thanks for your comment @{username}!"
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

// Helper functions
function getNodeBorderColor(type: string) {
  switch (type) {
    case 'trigger':
      return 'border-blue-300 bg-blue-50';
    case 'condition':
      return 'border-yellow-300 bg-yellow-50';
    case 'action':
      return 'border-green-300 bg-green-50';
    default:
      return 'border-gray-300';
  }
}

function getNodeIcon(type: string) {
  switch (type) {
    case 'trigger':
      return <Hash className="h-4 w-4 text-blue-600" />;
    case 'condition':
      return <GitBranch className="h-4 w-4 text-yellow-600" />;
    case 'action':
      return <Send className="h-4 w-4 text-green-600" />;
    default:
      return null;
  }
}
