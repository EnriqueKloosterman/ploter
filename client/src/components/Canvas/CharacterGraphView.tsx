import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, useNodesState, useEdgesState, MarkerType, Background, BackgroundVariant } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { useProject } from '../../context/useProject';
import type { ICharacterRelation } from '../../context/projectTypes';
import CharacterNode from './CharacterNode';
import RelationEditModal from './RelationEditModal';

const nodeTypes = { characterNode: CharacterNode };

const RELATION_COLORS: Record<string, string> = {
  familia: '#f59e0b',
  romance: '#ec4899',
  enemistad: '#ef4444',
  aliado: '#10b981',
  mentor: '#3b82f6',
};

const RELATION_LABELS: Record<string, string> = {
  familia: 'Familia',
  romance: 'Romance',
  enemistad: 'Enemistad',
  aliado: 'Aliado',
  mentor: 'Mentor',
};

const CharacterGraphView: React.FC = () => {
  const { t } = useTranslation();
  const { project, addRelation, updateRelation, removeRelation } = useProject();
  const { characters, characterRelations } = project;
  const [editingRelation, setEditingRelation] = useState<ICharacterRelation | null>(null);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const initializedRef = useRef(false);

  const initialNodes: Node[] = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(characters.length));
    return characters.map((ch, idx) => ({
      id: ch.id,
      type: 'characterNode',
      position: { x: 120 + (idx % cols) * 180, y: 80 + Math.floor(idx / cols) * 140 },
      data: {
        label: ch.name,
        image: ch.image?.url || undefined,
        color: 'slate',
        characterId: ch.id,
      },
    }));
  }, [characters]);

  const initialEdges: Edge[] = useMemo(() => {
    return (characterRelations || []).map((rel) => ({
      id: rel.id,
      source: rel.sourceId,
      target: rel.targetId,
      animated: rel.type === 'romance',
      style: { stroke: RELATION_COLORS[rel.type] || '#64748b', strokeWidth: 2 },
      label: rel.label || RELATION_LABELS[rel.type] || rel.type,
      labelStyle: { fill: RELATION_COLORS[rel.type] || '#64748b', fontSize: 10, fontWeight: 600 },
      markerEnd: { type: MarkerType.ArrowClosed, color: RELATION_COLORS[rel.type] || '#64748b', width: 15, height: 15 },
      data: { relationId: rel.id },
    }));
  }, [characterRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (!initializedRef.current) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      initializedRef.current = true;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const rel = (characterRelations || []).find((r) => r.id === edge.id);
    if (rel) {
      setEditingRelation(rel);
      setShowRelationModal(true);
    }
  }, [characterRelations]);

  const handleSaveRelation = useCallback((data: { sourceId: string; targetId: string; type: ICharacterRelation['type']; label?: string; description?: string }) => {
    if (editingRelation) {
      updateRelation(editingRelation.id, data);
    } else {
      addRelation({
        id: `rel_${Date.now()}`,
        ...data,
      });
    }
  }, [editingRelation, addRelation, updateRelation]);

  const handleDeleteRelation = useCallback((relationId: string) => {
    removeRelation(relationId);
  }, [removeRelation]);

  const handleNewRelation = useCallback(() => {
    setEditingRelation(null);
    setShowRelationModal(true);
  }, []);

  const hasRelations = (characterRelations || []).length > 0;

  return (
    <div className="h-full w-full bg-slate-900 relative">
      {characters.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <EmptyState icon={Users} message={t('characters.noCharacters')} />
        </div>
      ) : (
        <>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeClick={handleEdgeClick}
            fitView
            minZoom={0.3}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
          </ReactFlow>

          <div className="absolute top-4 left-12 z-10 flex gap-2">
            <button
              onClick={handleNewRelation}
              disabled={characters.length < 2}
              className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-strong disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              + Relacion
            </button>
            <div className="flex flex-wrap gap-1 items-center bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5">
              {Object.entries(RELATION_COLORS).map(([type, color]) => (
                <span key={type} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}30`, color }}>
                  {RELATION_LABELS[type]}
                </span>
              ))}
            </div>
          </div>

          {!hasRelations && characters.length >= 2 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-800/90 border border-slate-700/60 rounded-lg px-4 py-2 text-xs text-slate-400 shadow-lg whitespace-nowrap">
              Haz clic en "+ Relacion" arriba a la izquierda para conectar personajes
            </div>
          )}
        </>
      )}

      <RelationEditModal
        isOpen={showRelationModal}
        characters={characters}
        editingRelation={editingRelation}
        onSave={handleSaveRelation}
        onDelete={handleDeleteRelation}
        onClose={() => setShowRelationModal(false)}
      />
    </div>
  );
};

export default CharacterGraphView;
