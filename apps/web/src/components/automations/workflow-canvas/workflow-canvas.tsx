'use client';

import { useState, useCallback, useRef, useEffect, DragEvent } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './node-types';
import { NodesPanel } from './nodes-panel';
import { PropertiesPanel } from './properties-panel';
import { VariablesModal } from './variables-modal';

interface WorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onChange?: (nodes: Node[], edges: Edge[]) => void;
  emailTemplates?: Array<{ id: string; name: string }>;
  objectId?: string;
  objectName?: string;
}

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#666', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#666',
  },
};

function WorkflowCanvasInner({
  initialNodes = [],
  initialEdges = [],
  onChange,
  emailTemplates = [],
  objectId,
  objectName,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [variables, setVariables] = useState<Array<{ name: string; value: string }>>([]);
  const [isVariablesModalOpen, setIsVariablesModalOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  // Sync with parent's nodes/edges when they change (for loading existing workflows)
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  // Notify parent of changes
  const handleChange = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      onChange?.(newNodes, newEdges);
    },
    [onChange]
  );

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Connect nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          ...defaultEdgeOptions,
        },
        edges
      );
      setEdges(newEdges);
      handleChange(nodes, newEdges);
    },
    [edges, nodes, setEdges, handleChange]
  );

  // Handle drop from panel
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const nodeType = event.dataTransfer.getData('application/reactflow/type');
      const subType = event.dataTransfer.getData('application/reactflow/subtype');
      const label = event.dataTransfer.getData('application/reactflow/label');

      if (!nodeType) return;

      // Use screenToFlowPosition directly with client coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getNodeId(),
        type: nodeType,
        position,
        data: {
          label: label || `${nodeType} ${nodes.filter((n) => n.type === nodeType).length + 1}`,
          ...(nodeType === 'trigger' && {
            triggerType: subType,
            objectId,
            objectName,
          }),
          ...(nodeType === 'action' && {
            actionType: subType,
            config: {},
          }),
          ...(nodeType === 'condition' && {
            field: '',
            operator: 'equals',
            value: '',
          }),
          ...(nodeType === 'loop' && {
            collection: '',
            itemVariable: 'item',
          }),
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      handleChange(newNodes, edges);
    },
    [nodes, edges, setNodes, screenToFlowPosition, objectId, objectName, handleChange]
  );

  // Select node
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    []
  );

  // Deselect on pane click
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update node data
  const updateNode = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      const newNodes = nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      );
      setNodes(newNodes);
      setSelectedNode(newNodes.find((n) => n.id === nodeId) || null);
      handleChange(newNodes, edges);
    },
    [nodes, edges, setNodes, handleChange]
  );

  // Delete node
  const deleteNode = useCallback(
    (nodeId: string) => {
      const newNodes = nodes.filter((n) => n.id !== nodeId);
      const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedNode(null);
      handleChange(newNodes, newEdges);
    },
    [nodes, edges, setNodes, setEdges, handleChange]
  );

  // Duplicate node
  const duplicateNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const newNode: Node = {
        ...node,
        id: getNodeId(),
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: {
          ...node.data,
          label: `${node.data.label} (copy)`,
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      handleChange(newNodes, edges);
    },
    [nodes, edges, setNodes, handleChange]
  );

  // Add variable
  const addVariable = useCallback((name: string, value: string) => {
    setVariables((prev) => [...prev, { name, value }]);
  }, []);

  return (
    <div className="flex h-full w-full">
      {/* Left Panel - Nodes */}
      <NodesPanel onAddVariable={() => setIsVariablesModalOpen(true)} />

      {/* Canvas */}
      <div ref={reactFlowWrapper} className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          className="bg-[#0d0d12]"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#333"
          />
          <Controls
            className="!bg-zinc-800 !border-white/10 !rounded-lg [&>button]:!bg-zinc-700 [&>button]:!border-white/10 [&>button]:!text-white [&>button:hover]:!bg-zinc-600"
          />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'trigger':
                  return '#f97316';
                case 'action':
                  return '#3b82f6';
                case 'condition':
                  return '#eab308';
                case 'loop':
                  return '#06b6d4';
                default:
                  return '#666';
              }
            }}
            className="!bg-zinc-800/80 !border-white/10 !rounded-lg"
            maskColor="rgba(0,0,0,0.8)"
          />
        </ReactFlow>
      </div>

      {/* Right Panel - Properties */}
      {selectedNode && (
        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          onDuplicateNode={duplicateNode}
          onClose={() => setSelectedNode(null)}
          emailTemplates={emailTemplates}
          variables={variables}
        />
      )}

      {/* Variables Modal */}
      <VariablesModal
        isOpen={isVariablesModalOpen}
        onClose={() => setIsVariablesModalOpen(false)}
        variables={variables}
        onAdd={addVariable}
        onRemove={(name) => setVariables((prev) => prev.filter((v) => v.name !== name))}
      />
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
