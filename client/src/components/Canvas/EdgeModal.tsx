import React, { useState } from 'react';
import type { Edge } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';

interface EdgeModalProps {
  isOpen: boolean;
  edge: Edge | null;
  onClose: () => void;
  onSave: (updatedEdge: Edge) => void;
  onDelete: (edgeId: string) => void;
}

const getEdgeType = (edge: Edge | null) => {
  if (!edge) return 'normal';

  if (edge.data?.type && ['normal', 'causa', 'conflicto'].includes(edge.data.type as string)) {
    return edge.data.type as 'normal' | 'causa' | 'conflicto';
  }

  if (edge.animated && edge.style?.stroke === '#10b981') return 'causa';
  if (edge.style?.strokeDasharray && edge.style?.stroke === '#ef4444') return 'conflicto';

  return 'normal';
};

const EdgeModal: React.FC<EdgeModalProps> = ({ isOpen, edge, onClose, onSave, onDelete }) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState(() => String(edge?.label || ''));
  const [edgeType, setEdgeType] = useState(() => getEdgeType(edge));

  if (!isOpen || !edge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedEdge = { ...edge, label: label || undefined, data: { ...edge.data, type: edgeType } };

    if (edgeType === 'causa') {
      updatedEdge.animated = true;
      updatedEdge.style = { stroke: '#10b981', strokeWidth: 2 };
    } else if (edgeType === 'conflicto') {
      updatedEdge.animated = false;
      updatedEdge.style = { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' };
    } else {
      updatedEdge.animated = false;
      updatedEdge.style = { stroke: '#94a3b8', strokeWidth: 1.5 };
    }

    onSave(updatedEdge);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('edgeModal.editConnection')} size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('edgeModal.connectionLabel')}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              placeholder={t('edgeModal.connectionLabelPlaceholder')}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('edgeModal.relationshipType')}
            </label>
            <select
              value={edgeType}
               onChange={(e) => setEdgeType(e.target.value as 'normal' | 'causa' | 'conflicto')}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            >
              <option value="normal">{t('edgeModal.typeNormal')}</option>
              <option value="causa">{t('edgeModal.typeCause')}</option>
              <option value="conflicto">{t('edgeModal.typeConflict')}</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-800/50 flex gap-3 flex-row-reverse">
            <button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent-strong text-white font-medium py-2 rounded-lg transition-colors shadow-lg shadow-accent/20"
            >
              {t('edgeModal.saveConnection')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(edge.id)}
              className="px-4 py-2 bg-slate-800 hover:bg-red-500/20 text-red-400 border border-transparent hover:border-red-500/50 font-medium rounded-lg transition-colors flex items-center justify-center"
              title={t('edgeModal.deleteEdge')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default EdgeModal;
