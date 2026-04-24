import React, { useCallback, useState, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, BackgroundVariant, addEdge, useReactFlow, reconnectEdge } from '@xyflow/react';
import type { Connection, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '../../context/ProjectContext';
import type { INodeData } from '../../context/ProjectContext';
import PlotCardNode from './PlotCardNode';
import PlotNodeModal from './PlotNodeModal';

const nodeTypes = {
  plot_card: PlotCardNode,
};

const CanvasAreaInner: React.FC = () => {
  const { project, updateNodes, updateEdges } = useProject();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  
  // Transform our INode to React Flow's expected Node format.
  const [nodes, setNodes, onNodesChange] = useNodesState(project.canvas.nodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(project.canvas.edges as unknown as Edge[]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => {
      const newEdges = addEdge(connection, eds);
      // Actualiza Context para Guardado DB
      updateEdges(newEdges as unknown as typeof project.canvas.edges);
      return newEdges;
    });
  }, [setEdges, updateEdges]);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges((eds) => {
      const reconnectedEds = reconnectEdge(oldEdge, newConnection, eds);
      updateEdges(reconnectedEds as unknown as typeof project.canvas.edges);
      return reconnectedEds;
    });
  }, [setEdges, updateEdges]);

  // Click handler para abrir modal
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setModalOpen(true);
  }, []);

  // Update real desde el Modal
  const handleSaveNode = useCallback((nodeId: string, newData: INodeData) => {
    const freshNodes = nodes.map((n) => {
      if (n.id === nodeId) {
        return { ...n, data: newData as any };
      }
      return n;
    });
    
    // Actualiza React Flow Inmediatamente (Visual)
    setNodes(freshNodes);
    // Actualiza Context para Guardado DB
    updateNodes(freshNodes as unknown as typeof project.canvas.nodes);
  }, [nodes, setNodes, updateNodes]);

  // Referencia mutable para el autosave sin regenerar el ciclo
  const projectRef = React.useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Ref para capturar el estado visual actual y mandarlo a Context al parar de arrastrar
  const nodesRef = React.useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const onNodeDragStop = useCallback(() => {
    // Cuando el usuario suelta la tarjeta, registramos su posición final en el context global
    updateNodes(nodesRef.current as unknown as typeof project.canvas.nodes);
  }, [updateNodes]);

  // Autosave Silencioso cada 60s fijos
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      try {
        const currentProject = projectRef.current;
        if (!currentProject.metadata?.projectId) return;

        setIsAutoSaving(true);
        await fetch(`http://localhost:5000/api/projects/${currentProject.metadata.projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentProject)
        });
        
        // Quitar la nota de 'Guardando...' visual luego de 2s
        setTimeout(() => setIsAutoSaving(false), 2000);
      } catch (e) {
        console.error('Autosave falló en la red:', e);
      }
    }, 60000); // 60,000ms = 1 min

    return () => clearInterval(saveInterval);
  }, []);

  const handleAddNode = () => {
    const newNodeId = `node_${Date.now()}`;
    const newNodeData: INodeData = {
      title: 'Nueva Escena',
      content: 'Escribe los eventos aquí...',
      color: 'slate',
      characterTags: [],
      chapterId: '' // Base vacía para capítulos
    };
    
    // Calcula la posición mapeando el centro geométrico de la pantalla actual al Canvas interior
    const centerPos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    const newNode: Node = {
      id: newNodeId,
      type: 'plot_card',
      position: { x: centerPos.x - 120, y: centerPos.y - 120 }, // Offsets for card width centering
      data: newNodeData as any
    };

    const newNodesList = [...nodes, newNode];
    setNodes(newNodesList);
    updateNodes(newNodesList as unknown as typeof project.canvas.nodes);

    // Abrir el modal automáticamente con la nueva tarjeta recién creada
    setSelectedNode(newNode);
    setModalOpen(true);
  };

  const onNodesDelete = useCallback((deleted: Node[]) => {
    const deletedIds = deleted.map(d => d.id);
    const remaining = nodes.filter(n => !deletedIds.includes(n.id));
    updateNodes(remaining as unknown as typeof project.canvas.nodes);
  }, [nodes, updateNodes]);

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    const deletedIds = deleted.map(d => d.id);
    const remaining = edges.filter(e => !deletedIds.includes(e.id));
    updateEdges(remaining as unknown as typeof project.canvas.edges);
  }, [edges, updateEdges]);

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: any) => {
    // Si la conexión no se ancló a un target válido, fue soltada en el aire.
    if (!connectionState.isValid && connectionState.fromNode) {
      // Validamos visualmente que soltó sobre el pane general (el canvas vacío)
      const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');

      if (targetIsPane) {
        const { clientX, clientY } = 'clientX' in event ? event : event.touches[0];
        const rawPosition = screenToFlowPosition({ x: clientX, y: clientY });
        
        // Compensamos el centrado de la tarjeta (ancho aprox 250, alto 120)
        const position = { x: rawPosition.x - 125, y: rawPosition.y - 60 };

        const newNodeId = `node_${Date.now()}`;
        const newNodeData: INodeData = {
          title: 'Continuación',
          content: 'Detalla cómo sigue la historia aquí...',
          color: 'slate',
          characterTags: [],
          chapterId: '' // Base vacía para capítulos
        };
        const newNode: Node = {
          id: newNodeId,
          type: 'plot_card',
          position,
          data: newNodeData as any
        };

        const newEdge: Edge = {
          id: `edge_${connectionState.fromNode.id}-${newNodeId}`,
          source: connectionState.fromNode.id,
          target: newNodeId,
          sourceHandle: connectionState.fromHandle?.id || null,
        };

        // Inject new node and edge simultaneously
        setNodes((nds) => {
          const freshNodes = [...nds, newNode];
          updateNodes(freshNodes as unknown as typeof project.canvas.nodes);
          return freshNodes;
        });
        setEdges((eds) => {
          const freshEdges = [...eds, newEdge];
          updateEdges(freshEdges as unknown as typeof project.canvas.edges);
          return freshEdges;
        });
      }
    }
  }, [screenToFlowPosition, updateNodes, updateEdges, setNodes, setEdges]);

  const getMiniMapColor = (node: Node) => {
    switch ((node.data?.color as string)?.toLowerCase()) {
      case 'red': return '#ef4444';
      case 'orange': return '#f97316';
      case 'yellow': return '#eab308';
      case 'green': return '#10b981';
      case 'blue': return '#3b82f6';
      case 'purple': return '#a855f7';
      default: return '#64748b'; // slate-500
    }
  };

  return (
    <div className="flex-1 relative bg-slate-900 border-l border-white/5 h-full w-full min-h-screen">
      
      {/* Top Bar Floating Commands */}
      <div className="absolute top-4 right-4 z-10 flex gap-3 items-center">
        {isAutoSaving && (
          <span className="text-xs font-medium text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-emerald-500/30 animate-pulse backdrop-blur-sm">
            Guardado ✅
          </span>
        )}
        <button 
          onClick={handleAddNode}
          className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] backdrop-blur-sm transition-all hover:scale-105"
        >
          + Añadir Tarjeta
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
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      {isModalOpen && selectedNode && (
        <PlotNodeModal
          node={selectedNode}
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveNode}
        />
      )}
    </div>
  );
};

export default CanvasAreaInner;
