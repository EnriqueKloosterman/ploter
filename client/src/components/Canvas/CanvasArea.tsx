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
import {
  BookOpen,
  ChevronRight,
  Clock,
  Download,
  FileText,
  HelpCircle,
  LayoutGrid,
  List,
  Maximize2,
  MessageSquare,
  Plus,
  Redo2,
  Sparkles,
  Undo2,
  Users,
  X
} from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { useProject } from '../../context/useProject';
import type { IEdge, INode, INodeData } from '../../context/projectTypes';
import PlotCardNode from './PlotCardNode';
import PlotNodeModal from './PlotNodeModal';
import ShortcutsModal from '../ui/ShortcutsModal';
import CanvasBgModal from '../ui/CanvasBgModal';
import EdgeModal from './EdgeModal';
import OutlineView from './OutlineView';
import TimelineView from './TimelineView';
import ManuscriptEditor from './ManuscriptEditor';
import CharacterGraphView from './CharacterGraphView';
import AIPanel from './AIPanel';
import ExportModal from './ExportModal';
import StoryBibleView from './StoryBibleView';
import StoryFlowView from './StoryFlowView';
import { InkStatusContext } from './inkStatusContext';
import type { InkNodeStatus } from './inkStatusContext';

const InkStudioView = React.lazy(() => import('./InkStudioView'));

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
  const canvasBackground = project.canvas.background;
  const [selectedNode, setSelectedNode] = useState<PlotFlowNode | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);
  const [isBgModalOpen, setBgModalOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [edgeEditKey, setEdgeEditKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOutline, setShowOutline] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showManuscript, setShowManuscript] = useState(false);
  const [showCharGraph, setShowCharGraph] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showStoryBible, setShowStoryBible] = useState(false);
  const [showStoryFlow, setShowStoryFlow] = useState(false);
  const [showInkStudio, setShowInkStudio] = useState(false);
  const [inkStudioNodeId, setInkStudioNodeId] = useState<string | null>(null);
  const [inkNodeStatus, setInkNodeStatus] = useState<Record<string, InkNodeStatus>>({});
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
  const edgesRef = useRef(edges);
  const lastProjectRef = useRef('');

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

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
    const deletedIds = new Set(deleted.map((node) => node.id));
    const remainingNodes = nodesRef.current.filter((node) => !deletedIds.has(node.id));
    updateNodes(toProjectNodes(remainingNodes));

    const remainingEdges = edgesRef.current.filter(
      (edge) => !deletedIds.has(edge.source) && !deletedIds.has(edge.target)
    );
    if (remainingEdges.length !== edgesRef.current.length) {
      updateEdges(toProjectEdges(remainingEdges));
    }
  }, [updateNodes, updateEdges]);

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    const deletedIds = new Set(deleted.map((edge) => edge.id));
    const currentEdges = edgesRef.current;
    const remaining = currentEdges.filter((edge) => !deletedIds.has(edge.id));
    if (remaining.length !== currentEdges.length) {
      updateEdges(toProjectEdges(remaining));
    }
  }, [updateEdges]);

  const onConnectEnd: OnConnectEnd = useCallback(() => {
    // no-op: card creation from handles is disabled
  }, []);

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
    <InkStatusContext.Provider value={inkNodeStatus}>
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
            className="w-36 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              aria-label="Limpiar busqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          onClick={() => { setShowTimeline(false); setShowManuscript(false); setShowCharGraph(false); setShowAiPanel(false); setShowStoryBible(false); setShowStoryFlow(false); setShowInkStudio(false); setShowOutline((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showOutline
              ? 'bg-blue-600/80 text-white border-blue-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showOutline ? 'Volver al grafo' : 'Vista esquema'}
          aria-label={showOutline ? 'Volver al grafo' : 'Vista esquema'}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowManuscript(false); setShowCharGraph(false); setShowAiPanel(false); setShowStoryBible(false); setShowStoryFlow(false); setShowInkStudio(false); setShowTimeline((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showTimeline
              ? 'bg-emerald-600/80 text-white border-emerald-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showTimeline ? 'Volver al grafo' : 'Linea de tiempo'}
          aria-label={showTimeline ? 'Volver al grafo' : 'Linea de tiempo'}
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowCharGraph(false); setShowAiPanel(false); setShowStoryBible(false); setShowStoryFlow(false); setShowInkStudio(false); setShowManuscript((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showManuscript
              ? 'bg-purple-600/80 text-white border-purple-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showManuscript ? 'Volver al grafo' : 'Manuscrito'}
          aria-label={showManuscript ? 'Volver al grafo' : 'Manuscrito'}
        >
          <FileText className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowManuscript(false); setShowCharGraph(false); setShowAiPanel(false); setShowStoryFlow(false); setShowInkStudio(false); setShowStoryBible((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showStoryBible
              ? 'bg-amber-600/80 text-white border-amber-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showStoryBible ? 'Volver al grafo' : 'Story Bible'}
          aria-label={showStoryBible ? 'Volver al grafo' : 'Story Bible'}
        >
          <BookOpen className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowManuscript(false); setShowCharGraph(false); setShowAiPanel(false); setShowStoryBible(false); setShowInkStudio(false); setShowStoryFlow((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showStoryFlow
              ? 'bg-indigo-600/80 text-white border-indigo-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showStoryFlow ? 'Volver al grafo' : 'Story Flow'}
          aria-label={showStoryFlow ? 'Volver al grafo' : 'Story Flow'}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowManuscript(false); setShowCharGraph(false); setShowAiPanel(false); setShowStoryBible(false); setShowStoryFlow(false); setShowInkStudio((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showInkStudio
              ? 'bg-teal-600/80 text-white border-teal-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showInkStudio ? 'Volver al grafo' : 'Ink Studio (narrativa ramificada)'}
          aria-label={showInkStudio ? 'Volver al grafo' : 'Ink Studio (narrativa ramificada)'}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={() => setBgModalOpen(true)}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs"
          title="Cambiar fondo del canvas"
          aria-label="Cambiar fondo del canvas"
        >
          <LayoutGrid className="w-4 h-4" />
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
          aria-label="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 disabled:text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Rehacer (Ctrl+Shift+Z)"
          aria-label="Rehacer (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowManuscript(false); setShowAiPanel(false); setShowInkStudio(false); setShowCharGraph((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showCharGraph
              ? 'bg-rose-600/80 text-white border-rose-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showCharGraph ? 'Volver al grafo' : 'Grafo de personajes'}
          aria-label={showCharGraph ? 'Volver al grafo' : 'Grafo de personajes'}
        >
          <Users className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setShowOutline(false); setShowTimeline(false); setShowManuscript(false); setShowCharGraph(false); setShowInkStudio(false); setShowAiPanel((v) => !v); }}
          className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:scale-105 text-xs ${
            showAiPanel
              ? 'bg-purple-600/80 text-white border-purple-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'
          }`}
          title={showAiPanel ? 'Volver al grafo' : 'Asistente IA'}
          aria-label={showAiPanel ? 'Volver al grafo' : 'Asistente IA'}
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Exportar manuscrito (PDF, DOCX, EPUB, HTML, Fountain)"
          aria-label="Exportar manuscrito (PDF, DOCX, EPUB, HTML, Fountain)"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-accent rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Ver atajos de teclado"
          aria-label="Ver atajos de teclado"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm transition-all hover:scale-105"
          title="Pantalla completa"
          aria-label="Pantalla completa"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleAddNode}
          className="px-4 py-2 bg-accent hover:bg-accent-strong text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Anadir tarjeta
        </button>
      </div>

      {showAiPanel || showCharGraph || showManuscript || showTimeline || showOutline || showStoryBible || showStoryFlow || showInkStudio ? (
        <div className="h-full w-full pt-[52px]">
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
      ) : showStoryBible ? (
        <StoryBibleView />
      ) : showStoryFlow ? (
        <StoryFlowView />
      ) : showInkStudio ? (
        <React.Suspense
          fallback={
            <div className="h-full w-full bg-slate-900 flex items-center justify-center">
              <span className="text-slate-500 text-sm">Cargando Ink Studio...</span>
            </div>
          }
        >
          <InkStudioView
            initialNodeId={inkStudioNodeId}
            onStatusMap={setInkNodeStatus}
            onClose={() => setShowInkStudio(false)}
          />
        </React.Suspense>
        ) : null}
        </div>
      ) : (
        <>
          {canvasBackground?.imageUrl && (
            <div
              className="absolute inset-0 pointer-events-none bg-cover bg-center"
              style={{
                backgroundImage: `url(${canvasBackground.imageUrl})`,
                opacity: canvasBackground.imageOpacity ?? 0.4,
              }}
              aria-hidden="true"
            />
          )}
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
              style={{ backgroundColor: 'var(--color-surface-raised)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
              onNodeClick={(_, node) => setCenter(node.position.x + 125, node.position.y + 125, { duration: 800, zoom: 1.2 })}
            />
            {!canvasBackground?.imageUrl && <Background variant={(canvasBackground?.variant ?? 'dots') as BackgroundVariant} gap={12} size={1} />}
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
              onOpenInkStudio={(nodeId) => { setInkStudioNodeId(nodeId); setShowInkStudio(true); }}
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

      <CanvasBgModal
        isOpen={isBgModalOpen}
        onClose={() => setBgModalOpen(false)}
      />
    </div>
    </InkStatusContext.Provider>
  );
};

export default CanvasAreaInner;
