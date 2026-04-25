import React, { useState } from 'react';
import type { Edge } from '@xyflow/react';

interface EdgeModalProps {
  isOpen: boolean;
  edge: Edge | null;
  onClose: () => void;
  onSave: (updatedEdge: Edge) => void;
  onDelete: (edgeId: string) => void;
}

const getEdgeType = (edge: Edge | null) => {
  if (!edge) return 'normal';

  if (edge.animated && edge.style?.stroke === '#10b981') {
    return 'causa';
  }

  if (edge.style?.strokeDasharray && edge.style?.stroke === '#ef4444') {
    return 'conflicto';
  }

  return 'normal';
};

const EdgeModal: React.FC<EdgeModalProps> = ({ isOpen, edge, onClose, onSave, onDelete }) => {
  const [label, setLabel] = useState(() => String(edge?.label || ''));
  const [edgeType, setEdgeType] = useState(() => getEdgeType(edge));

  if (!isOpen || !edge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedEdge = { ...edge, label: label || undefined };

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden ring-1 ring-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-850 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-200">Editar Conexion</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Etiqueta de conexion
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ej. Una semana despues..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tipo de relacion
            </label>
            <select
              value={edgeType}
              onChange={(e) => setEdgeType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="normal">Normal (Secuencia estatica)</option>
              <option value="causa">Causa y Efecto (Flujo animado)</option>
              <option value="conflicto">Conflicto / Subtrama (Roja punteada)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-800/50 flex gap-3 flex-row-reverse">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              Guardar conexion
            </button>
            <button
              type="button"
              onClick={() => onDelete(edge.id)}
              className="px-4 py-2 bg-slate-800 hover:bg-red-500/20 text-red-400 border border-transparent hover:border-red-500/50 font-medium rounded-lg transition-colors"
              title="Borrar Arista"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EdgeModal;
