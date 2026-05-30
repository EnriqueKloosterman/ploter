import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { Connection, Edge, Node, OnConnectEnd } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '../../context/useProject';
import type { IEdge, INode, INodeData } from '../../context/projectTypes';
import PlotCardNode from './PlotCardNode';
import PlotNodeModal from './PlotNodeModal';
import ShortcutsModal from '../ui/ShortcutsModal';
import EdgeModal from './EdgeModal';
import OutlineView from './OutlineView';
import TimelineView from './TimelineView';
import ManuscriptEditor from './ManuscriptEditor';
import CharacterGraphView from './CharacterGraphView';
import AIPanel from './AIPanel';
import ExportModal from './ExportModal';

const nodeTypes = {
  plot_card: PlotCardNode
};

type PlotFlowNode = Node<INodeData>;

const toProjectNodes = (flowNodes: PlotFlowNode[]): INode[] =>
  flowNodes.map(({ id, type, position, data }) => ({ id, type: type ?? 'plot_card', position, data }));

const toProjectEdges = (flowEdges: Edge[]): IEdge[] =>
  flowEdges.map(({ id, source, target, sourceHandle, targetHandle, label, data }) => ({
    id, source, target,
    sourceHandle: sourceHandle ?? undefined,
    targetHandle: targetHandle ?? undefined,
    label: typeof label === 'string' ? label : undefined,
    type: (data as { type?: 'normal' | 'causa' | 'conflicto' })?.type ?? undefined,
  }));

const toFlowNodes = (projectNodes: INode[]): PlotFlowNode[] =>
  projectNodes.map(({ id, type, position, data }) => ({ id, type, position, data }));

const toFlowEdges = (projectEdges: IEdge[]): Edge[] =>
  projectEdges.map(({ id, source, target, sourceHandle, targetHandle, label, type }) => ({
    id, source, target, sourceHandle, targetHandle, label,
    data: type ? { type } : undefined,
  }));

const CanvasAreaInner: React.FC = () => {
  const { project, updateNodes, updateEdges, isSaving, hasUnsavedChanges, saveProject, undo, redo, canUndo, canRedo, addChapter } = useProject();
  const [selectedNode, setSelectedNode] = useState<PlotFlowNode | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [edgeEditKey, setEdgeEditKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOutline, setShowOutline] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showManuscript, setShowManuscript] = useState(false);
  const [showCharGraph, setShowCharGraph] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const { screenToFlowPosition, setCenter } = useReactFlow();

  const flowContainerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(project.canvas.nodes));
  const displayNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    const matching = new Set(
      nodes.filter((n) => {
        const title = (n.data?.title || '').toLowerCase();
        const content = (n.data?.content || '').toLowerCase();
        return title.includes(q) || content.includes(q);
      }).map((n) => n.id)
    );
    return nodes.map((n) => ({
      ...n,
      data: { ...n.data, dimmed: !matching.has(n.id) },
    }));
  }, [nodes, searchQuery]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(project.canvas.edges));
  const nodesRef = useRef(nodes);
  const lastProjectRef = useRef('');

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const projectSnapshot = JSON.stringify(project.canvas);
    if (projectSnapshot === lastProjectRef.current) return;

    const flowAsProject = JSON.stringify({ nodes: toProjectNodes(nodes), edges: toProjectEdges(edges) });
    if (projectSnapshot !== flowAsProject) {
      setNodes(toFlowNodes(project.canvas.nodes));
      setEdges(toFlowEdges(project.canvas.edges));
    }
    lastProjectRef.current = projectSnapshot;
  }, [project.canvas, nodes, edges, setNodes, setEdges]);

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
    setEdgeEditKey(k => k + 1);
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
  const onNodeDragStop = useCallback(() => {
    updateNodes(toProjectNodes(nodesRef.current));
  }, [updateNodes]);

  const handleAddNode = useCallback(() => {
    setSearchQuery('');
    const newNodeId = `node_${Date.now()}`;
    const newNodeData: INodeData = {
      title: '',
      content: '',
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

  const handleAddChapter = useCallback(() => {
    const newChapterId = `Capitulo ${project.chapterManager.chapters.length + 1}`;
    addChapter({ chapterId: newChapterId, beats: [] });
  }, [addChapter, project.chapterManager.chapters.length]);

  const handleDuplicateNode = useCallback((sourceNode: PlotFlowNode) => {
    const newNodeId = `node_${Date.now()}`;
    const newNode: PlotFlowNode = {
      id: newNodeId,
      type: sourceNode.type,
      position: { x: sourceNode.position.x + 30, y: sourceNode.position.y + 30 },
      data: { ...sourceNode.data }
    };
    const newNodesList = [...nodes, newNode];
    setNodes(newNodesList);
    updateNodes(toProjectNodes(newNodesList));
    setSelectedNode(newNode);
    setModalOpen(true);
  }, [nodes, setNodes, updateNodes]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const cycleBgVariant = useCallback(() => {
    setBgVariant((prev) => {
      const variants = [BackgroundVariant.Dots, BackgroundVariant.Lines, BackgroundVariant.Cross];
      const idx = variants.indexOf(prev);
      return variants[(idx + 1) % variants.length];
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedo) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey && !isModalOpen && !editingEdge) {
        const el = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable) return;
        e.preventDefault();
        handleAddNode();
      }
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey && !isModalOpen && !editingEdge) {
        const el = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable) return;
        e.preventDefault();
        handleAddChapter();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveProject, undo, redo, canUndo, canRedo, handleAddNode, handleAddChapter, isModalOpen, editingEdge]);

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

  const onConnectEnd: OnConnectEnd = useCallback((event, connectionState) => {
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
    <div className="flex-1 relative bg-slate-900 border-l border-white/5 h-full w-full min-h-screen overflow-hidden" ref={flowContainerRef}>
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
        <span className="text-xs font-mono text-slate-500 bg-slate-800/60 px-2 py-1 rounded border border-slate-700/50">
          {Math.round(zoomLevel * 100)}%
        </span>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nodos..."
            className="w-36 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              x
            </button>
          )}
        </div>

        <button
          onClick={() => { setShowTimeline(false); setShowManuscript(false); setShowCharGraph(false); setShowAiPanel(false); setShowOutline((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showOutline
              ? 'bg-blue-600/80 text-white border-blue-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showOutline ? 'Volver al grafo' : 'Vista esquema'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowManuscript(false); setShowCharGraph(false); setShowAiPanel(false); setShowTimeline((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showTimeline
              ? 'bg-emerald-600/80 text-white border-emerald-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showTimeline ? 'Volver al grafo' : 'Linea de tiempo'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowCharGraph(false); setShowAiPanel(false); setShowManuscript((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showManuscript
              ? 'bg-purple-600/80 text-white border-purple-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showManuscript ? 'Volver al grafo' : 'Manuscrito'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          onClick={cycleBgVariant}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs"
          title="Cambiar fondo del canvas"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>

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
          onClick={undo}
          disabled={!canUndo}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 disabled:text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Deshacer (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 disabled:text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Rehacer (Ctrl+Shift+Z)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowManuscript(false); setShowAiPanel(false); setShowCharGraph((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showCharGraph
              ? 'bg-rose-600/80 text-white border-rose-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showCharGraph ? 'Volver al grafo' : 'Grafo de personajes'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowManuscript(false); setShowCharGraph(false); setShowAiPanel((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showAiPanel
              ? 'bg-purple-600/80 text-white border-purple-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showAiPanel ? 'Volver al grafo' : 'Asistente IA'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Exportar manuscrito (PDF, DOCX, EPUB, HTML, Fountain)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-blue-400 font-bold rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Ver atajos de teclado"
        >
          ?
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Pantalla completa"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={handleAddNode}
          className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-sm transition-all hover:scale-105"
        >
          + Anadir tarjeta
        </button>
      </div>

      {showAiPanel ? (
        <AIPanel />
      ) : showCharGraph ? (
        <CharacterGraphView />
      ) : showManuscript ? (
        <ManuscriptEditor />
      ) : showTimeline ? (
        <TimelineView />
      ) : showOutline ? (
        <OutlineView />
      ) : (
        <>
          <ReactFlow
            nodes={displayNodes}
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
            onMoveEnd={(_, v) => setZoomLevel(v.zoom)}
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
            <Background variant={bgVariant} gap={12} size={1} />
          </ReactFlow>

          <EdgeModal
            key={editingEdge !== null ? `${editingEdge.id}-${edgeEditKey}` : 'edge-modal'}
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
              onDuplicate={handleDuplicateNode}
            />
          )}

          <ShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />

          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
          />
        </>
      )}
    </div>
  );
};

export default CanvasAreaInner;
