import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  addEdge,
  useReactFlow,
  reconnectEdge
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { useProject } from '../../context/useProject';
import type { IEdge, INode, INodeData } from '../../context/projectTypes';
import PlotCardNode from './PlotCardNode';
import PlotNodeModal from './PlotNodeModal';
import ShortcutsModal from '../ui/ShortcutsModal';
import EdgeModal from './EdgeModal';

const nodeTypes = {
  plot_card: PlotCardNode
};

type PlotFlowNode = Node<INodeData>;
type ConnectionState = {
  isValid: boolean;
  fromNode?: PlotFlowNode;
  fromHandle?: { id?: string | null } | null;
};

const toProjectNodes = (flowNodes: PlotFlowNode[]): INode[] => flowNodes as unknown as INode[];
const toProjectEdges = (flowEdges: Edge[]): IEdge[] => flowEdges as unknown as IEdge[];

const CanvasAreaInner: React.FC = () => {
  const { project, updateNodes, updateEdges, isSaving, hasUnsavedChanges } = useProject();
  const [selectedNode, setSelectedNode] = useState<PlotFlowNode | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const { screenToFlowPosition, setCenter } = useReactFlow();

  const flowContainerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(project.canvas.nodes as unknown as PlotFlowNode[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(project.canvas.edges as unknown as Edge[]);
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((currentEdges) => {
      const newEdges = addEdge(connection, currentEdges);
      updateEdges(toProjectEdges(newEdges));
      return newEdges;
    });
  }, [setEdges, updateEdges]);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges((currentEdges) => {
      const reconnectedEdges = reconnectEdge(oldEdge, newConnection, currentEdges);
      updateEdges(toProjectEdges(reconnectedEdges));
      return reconnectedEdges;
    });
  }, [setEdges, updateEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as PlotFlowNode);
    setModalOpen(true);
  }, []);

  const handleSaveNode = useCallback((nodeId: string, newData: INodeData) => {
    const freshNodes = nodes.map((node) => (
      node.id === nodeId ? { ...node, data: newData } : node
    ));

    setNodes(freshNodes);
    updateNodes(toProjectNodes(freshNodes));
  }, [nodes, setNodes, updateNodes]);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEditingEdge(edge);
  }, []);

  const handleSaveEdge = useCallback((updatedEdge: Edge) => {
    setEdges((currentEdges) => {
      const newEdges = currentEdges.map((edge) => edge.id === updatedEdge.id ? updatedEdge : edge);
      updateEdges(toProjectEdges(newEdges));
      return newEdges;
    });
    setEditingEdge(null);
  }, [setEdges, updateEdges]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((currentEdges) => {
      const newEdges = currentEdges.filter((edge) => edge.id !== edgeId);
      updateEdges(toProjectEdges(newEdges));
      return newEdges;
    });
    setEditingEdge(null);
  }, [setEdges, updateEdges]);

  const handleExport = useCallback(() => {
    if (!flowContainerRef.current) return;

    const controls = flowContainerRef.current.querySelector('.react-flow__panel') as HTMLElement | null;
    if (controls) controls.style.display = 'none';

    toPng(flowContainerRef.current, {
      backgroundColor: '#0f172a',
      pixelRatio: 2
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `PlotWeaver_export_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      if (controls) controls.style.display = 'block';
    }).catch((error) => {
      console.error('Error exporting image:', error);
      if (controls) controls.style.display = 'block';
    });
  }, []);

  const onNodeDragStop = useCallback(() => {
    updateNodes(toProjectNodes(nodesRef.current));
  }, [updateNodes]);

  const handleAddNode = useCallback(() => {
    const newNodeId = `node_${Date.now()}`;
    const newNodeData: INodeData = {
      title: 'Nueva Escena',
      content: 'Escribe los eventos aqui...',
      color: 'slate',
      characterTags: [],
      chapterId: ''
    };

    const centerPos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    const newNode: PlotFlowNode = {
      id: newNodeId,
      type: 'plot_card',
      position: { x: centerPos.x - 120, y: centerPos.y - 120 },
      data: newNodeData
    };

    const newNodesList = [...nodes, newNode];
    setNodes(newNodesList);
    updateNodes(toProjectNodes(newNodesList));
    setSelectedNode(newNode);
    setModalOpen(true);
  }, [nodes, screenToFlowPosition, setNodes, updateNodes]);

  const onNodesDelete = useCallback((deleted: Node[]) => {
    const deletedIds = deleted.map((node) => node.id);
    const remaining = nodes.filter((node) => !deletedIds.includes(node.id));
    updateNodes(toProjectNodes(remaining));
  }, [nodes, updateNodes]);

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    const deletedIds = deleted.map((edge) => edge.id);
    const remaining = edges.filter((edge) => !deletedIds.includes(edge.id));
    updateEdges(toProjectEdges(remaining));
  }, [edges, updateEdges]);

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: ConnectionState) => {
    if (!connectionState.isValid || !connectionState.fromNode) return;

    const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');
    if (!targetIsPane) return;

    const { clientX, clientY } = 'clientX' in event ? event : event.touches[0];
    const rawPosition = screenToFlowPosition({ x: clientX, y: clientY });
    const position = { x: rawPosition.x - 125, y: rawPosition.y - 60 };

    const newNodeId = `node_${Date.now()}`;
    const newNodeData: INodeData = {
      title: 'Continuacion',
      content: 'Detalla como sigue la historia aqui...',
      color: 'slate',
      characterTags: [],
      chapterId: ''
    };

    const newNode: PlotFlowNode = {
      id: newNodeId,
      type: 'plot_card',
      position,
      data: newNodeData
    };

    const newEdge: Edge = {
      id: `edge_${connectionState.fromNode.id}-${newNodeId}`,
      source: connectionState.fromNode.id,
      target: newNodeId,
      sourceHandle: connectionState.fromHandle?.id || null
    };

    setNodes((currentNodes) => {
      const freshNodes = [...currentNodes, newNode];
      updateNodes(toProjectNodes(freshNodes));
      return freshNodes;
    });

    setEdges((currentEdges) => {
      const freshEdges = [...currentEdges, newEdge];
      updateEdges(toProjectEdges(freshEdges));
      return freshEdges;
    });
  }, [screenToFlowPosition, setEdges, setNodes, updateEdges, updateNodes]);

  const getMiniMapColor = (node: Node) => {
    switch ((node.data?.color as string)?.toLowerCase()) {
      case 'red': return '#ef4444';
      case 'orange': return '#f97316';
      case 'yellow': return '#eab308';
      case 'green': return '#10b981';
      case 'blue': return '#3b82f6';
      case 'purple': return '#a855f7';
      default: return '#64748b';
    }
  };

  return (
    <div className="flex-1 relative bg-slate-900 border-l border-white/5 h-full w-full min-h-screen" ref={flowContainerRef}>
      <div className="absolute top-4 right-4 z-10 flex gap-3 items-center">
        {isSaving && (
          <span className="text-xs font-medium text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-emerald-500/30 animate-pulse backdrop-blur-sm">
            Guardando...
          </span>
        )}
        {!isSaving && hasUnsavedChanges && (
          <span className="text-xs font-medium text-amber-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-amber-500/30 backdrop-blur-sm">
            Cambios pendientes
          </span>
        )}
        <button
          onClick={handleExport}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-pink-400 font-bold rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Exportar a imagen HD"
        >
          P
        </button>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-blue-400 font-bold rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Ver atajos de teclado"
        >
          ?
        </button>
        <button
          onClick={handleAddNode}
          className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-sm transition-all hover:scale-105"
        >
          + Anadir tarjeta
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onConnectEnd={onConnectEnd}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
      >
        <Controls />
        <MiniMap
          nodeColor={getMiniMapColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor="rgba(15, 23, 42, 0.7)"
          style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
          onNodeClick={(_, node) => setCenter(node.position.x + 125, node.position.y + 125, { duration: 800, zoom: 1.2 })}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <EdgeModal
        key={editingEdge?.id ?? 'edge-modal'}
        isOpen={editingEdge !== null}
        edge={editingEdge}
        onClose={() => setEditingEdge(null)}
        onSave={handleSaveEdge}
        onDelete={handleDeleteEdge}
      />

      {isModalOpen && selectedNode && (
        <PlotNodeModal
          key={selectedNode.id}
          node={selectedNode}
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveNode}
        />
      )}

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
};

export default CanvasAreaInner;
