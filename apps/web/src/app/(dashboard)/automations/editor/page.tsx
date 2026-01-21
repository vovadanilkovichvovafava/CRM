'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Node, Edge } from '@xyflow/react';
import {
  ArrowLeft,
  Save,
  Loader2,
  Play,
  Pause,
  Settings,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api';
import { WorkflowCanvas } from '@/components/automations/workflow-canvas';
import { cn } from '@/lib/utils';

interface WorkflowSettings {
  name: string;
  description: string;
  objectId: string;
  isActive: boolean;
}

export default function WorkflowEditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workflowId = searchParams.get('id') || 'new';
  const isNew = workflowId === 'new';

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [settings, setSettings] = useState<WorkflowSettings>({
    name: 'New Workflow',
    description: '',
    objectId: '',
    isActive: false,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing workflow
  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => api.workflows.get(workflowId),
    enabled: !isNew,
  });

  // Fetch objects for selection
  const { data: objectsData } = useQuery({
    queryKey: ['objects'],
    queryFn: () => api.objects.list(),
  });

  // Fetch email templates for action configs
  const { data: templatesData } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => api.emailTemplates.list(),
  });

  const objects = useMemo(() => {
    return (objectsData?.data || []) as Array<{
      id: string;
      name: string;
      displayName: string;
    }>;
  }, [objectsData?.data]);

  const emailTemplates = (templatesData?.data || []) as Array<{
    id: string;
    name: string;
  }>;

  // Load workflow data
  useEffect(() => {
    if (workflow) {
      setSettings({
        name: workflow.name,
        description: workflow.description || '',
        objectId: workflow.objectId,
        isActive: workflow.isActive,
      });

      // Convert conditions and actions to nodes/edges
      const loadedNodes: Node[] = [];
      const loadedEdges: Edge[] = [];

      // Find trigger from conditions/actions structure
      const triggerType = workflow.trigger;
      loadedNodes.push({
        id: 'trigger_0',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: {
          label: triggerType.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
          triggerType,
          objectId: workflow.objectId,
          objectName: workflow.object.displayName,
        },
      });

      // Convert actions to action nodes
      const actions = (workflow.actions || []) as Array<{
        id: string;
        type: string;
        name: string;
        config: Record<string, unknown>;
        order: number;
      }>;

      actions.forEach((action, index) => {
        const nodeId = `action_${action.id || index}`;
        loadedNodes.push({
          id: nodeId,
          type: 'action',
          position: { x: 250, y: 200 + index * 150 },
          data: {
            label: action.name,
            actionType: action.type,
            config: action.config,
          },
        });

        // Connect to previous node
        const prevNodeId = index === 0 ? 'trigger_0' : `action_${actions[index - 1].id || (index - 1)}`;
        loadedEdges.push({
          id: `edge_${index}`,
          source: prevNodeId,
          target: nodeId,
          type: 'smoothstep',
          animated: true,
        });
      });

      setNodes(loadedNodes);
      setEdges(loadedEdges);
    } else if (isNew && objects.length > 0 && !settings.objectId) {
      // Set default object for new workflow
      setSettings((prev) => ({ ...prev, objectId: objects[0].id }));

      // Add default trigger node
      setNodes([
        {
          id: 'trigger_0',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: {
            label: 'Record Created',
            triggerType: 'RECORD_CREATED',
            objectId: objects[0].id,
            objectName: objects[0].displayName,
          },
        },
      ]);
    }
  }, [workflow, isNew, objects, settings.objectId]);

  // Convert nodes/edges to workflow format
  const convertToWorkflowFormat = useCallback(() => {
    const triggerNode = nodes.find((n) => n.type === 'trigger');
    const actionNodes = nodes.filter((n) => n.type === 'action');
    const conditionNodes = nodes.filter((n) => n.type === 'condition');

    // Build conditions from condition nodes
    const conditions = conditionNodes.map((node) => ({
      field: node.data.field as string,
      operator: node.data.operator as string,
      value: node.data.value as string,
    }));

    // Build actions from action nodes (maintain order based on edges)
    const orderedActions: Array<{
      id: string;
      type: string;
      name: string;
      config: Record<string, unknown>;
      order: number;
    }> = [];

    // Simple ordering based on y position
    const sortedActions = [...actionNodes].sort(
      (a, b) => a.position.y - b.position.y
    );

    sortedActions.forEach((node, index) => {
      orderedActions.push({
        id: node.id,
        type: node.data.actionType as string,
        name: node.data.label as string,
        config: (node.data.config as Record<string, unknown>) || {},
        order: index,
      });
    });

    return {
      trigger: (triggerNode?.data.triggerType as string) || 'RECORD_CREATED',
      conditions,
      actions: orderedActions,
    };
  }, [nodes]);

  // Save workflow
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { trigger, conditions, actions } = convertToWorkflowFormat();

      if (isNew) {
        return api.workflows.create({
          name: settings.name,
          description: settings.description || undefined,
          objectId: settings.objectId,
          trigger,
          conditions,
          actions,
          isActive: settings.isActive,
        });
      } else {
        return api.workflows.update(workflowId, {
          name: settings.name,
          description: settings.description || undefined,
          trigger,
          conditions,
          actions,
          isActive: settings.isActive,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(isNew ? 'Workflow created' : 'Workflow saved');
      setHasChanges(false);

      if (isNew && data) {
        const newWorkflow = data as { id: string };
        router.replace(`/automations/editor?id=${newWorkflow.id}`);
      }
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error('Failed to save workflow');
      }
    },
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: () => api.workflows.toggle(workflowId),
    onSuccess: () => {
      setSettings((prev) => ({ ...prev, isActive: !prev.isActive }));
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(settings.isActive ? 'Workflow deactivated' : 'Workflow activated');
    },
  });

  // Delete workflow
  const deleteMutation = useMutation({
    mutationFn: () => api.workflows.delete(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
      router.push('/automations');
    },
  });

  // Handle canvas changes
  const handleCanvasChange = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setHasChanges(true);
  }, []);

  // Get object name
  const selectedObject = objects.find((o) => o.id === settings.objectId);

  if (!isNew && isLoadingWorkflow) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0f] border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/automations">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Input
              value={settings.name}
              onChange={(e) => {
                setSettings({ ...settings, name: e.target.value });
                setHasChanges(true);
              }}
              className="bg-transparent border-none text-lg font-semibold text-white h-8 px-1 focus-visible:ring-0"
            />
            {hasChanges && (
              <span className="text-xs text-orange-400">• Unsaved</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
                className={cn(
                  'border-white/10',
                  settings.isActive
                    ? 'text-green-400 hover:text-green-300'
                    : 'text-white/60 hover:text-white'
                )}
              >
                {settings.isActive ? (
                  <>
                    <Pause className="h-3.5 w-3.5 mr-1.5" />
                    Active
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Inactive
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="border-white/10 text-white/60 hover:text-white"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Settings
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Delete this workflow?')) {
                    deleteMutation.mutate();
                  }
                }}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !settings.name.trim() || !settings.objectId}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Object selector for new workflows */}
      {isNew && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#0a0a0f]/50 border-b border-white/5">
          <span className="text-xs text-white/40">Object:</span>
          <select
            value={settings.objectId}
            onChange={(e) => {
              const obj = objects.find((o) => o.id === e.target.value);
              setSettings({ ...settings, objectId: e.target.value });
              // Update trigger node object
              setNodes((prev) =>
                prev.map((n) =>
                  n.type === 'trigger'
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          objectId: e.target.value,
                          objectName: obj?.displayName,
                        },
                      }
                    : n
                )
              );
              setHasChanges(true);
            }}
            className="rounded bg-white/5 border border-white/10 text-white px-2 py-1 text-sm"
          >
            {objects.map((obj) => (
              <option key={obj.id} value={obj.id} className="bg-zinc-900">
                {obj.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1">
        <WorkflowCanvas
          initialNodes={nodes}
          initialEdges={edges}
          onChange={handleCanvasChange}
          emailTemplates={emailTemplates}
          objectId={settings.objectId}
          objectName={selectedObject?.displayName}
        />
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Workflow Settings</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/60">Description</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => {
                    setSettings({ ...settings, description: e.target.value });
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/60">Object</label>
                <select
                  value={settings.objectId}
                  disabled
                  className="w-full rounded-lg bg-white/5 border border-white/10 text-white/60 px-3 py-2 text-sm"
                >
                  {objects.map((obj) => (
                    <option key={obj.id} value={obj.id} className="bg-zinc-900">
                      {obj.displayName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-white/30">Object cannot be changed after creation</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                className="border-white/10 text-white/60"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
