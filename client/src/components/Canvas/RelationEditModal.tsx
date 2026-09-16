import React, { useState } from 'react';
import type { ICharacter, ICharacterRelation } from '../../context/projectTypes';
import Modal from '../ui/Modal';

const RELATION_TYPES: ICharacterRelation['type'][] = ['familia', 'romance', 'enemistad', 'aliado', 'mentor'];
const TYPE_COLORS: Record<string, string> = {
  familia: '#f59e0b',
  romance: '#ec4899',
  enemistad: '#ef4444',
  aliado: '#10b981',
  mentor: '#3b82f6',
};
const TYPE_LABELS: Record<string, string> = {
  familia: 'Familia',
  romance: 'Romance',
  enemistad: 'Enemistad',
  aliado: 'Aliado',
  mentor: 'Mentor',
};

interface RelationEditModalProps {
  isOpen: boolean;
  characters: ICharacter[];
  editingRelation: ICharacterRelation | null;
  defaultSourceId?: string;
  defaultTargetId?: string;
  onSave: (relation: { sourceId: string; targetId: string; type: ICharacterRelation['type']; label?: string; description?: string }) => void;
  onDelete: (relationId: string) => void;
  onClose: () => void;
}

const RelationEditModal: React.FC<RelationEditModalProps> = ({ isOpen, characters, editingRelation, defaultSourceId, defaultTargetId, onSave, onDelete, onClose }) => {
  const [sourceId, setSourceId] = useState(editingRelation?.sourceId || defaultSourceId || '');
  const [targetId, setTargetId] = useState(editingRelation?.targetId || defaultTargetId || '');
  const [type, setType] = useState<ICharacterRelation['type']>(editingRelation?.type || 'aliado');
  const [label, setLabel] = useState(editingRelation?.label || '');
  const [description, setDescription] = useState(editingRelation?.description || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!sourceId || !targetId) {
      setError('Selecciona ambos personajes');
      return;
    }
    if (sourceId === targetId) {
      setError('Un personaje no puede relacionarse consigo mismo');
      return;
    }
    onSave({ sourceId, targetId, type, label: label.trim() || undefined, description: description.trim() || undefined });
    onClose();
  };

  const otherChars = characters.filter((c) => c.id !== sourceId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRelation ? 'Editar relacion' : 'Nueva relacion'}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Personaje A</label>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Seleccionar...</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 font-medium">se relaciona como</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de relacion</label>
            <div className="flex flex-wrap gap-2">
              {RELATION_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    type === t
                      ? 'text-white border-transparent'
                      : 'text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                  style={type === t ? { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : undefined}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 font-medium">con</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Personaje B</label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Seleccionar...</option>
              {otherChars.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Etiqueta (opcional)</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ej. Hermanos, Ex-amantes, Rivales" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Descripcion (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe la dinamica..." rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none" />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            {editingRelation && (
              <button type="button" onClick={() => { onDelete(editingRelation.id); onClose(); }} className="px-4 py-2 text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 rounded-lg transition-colors">
                Eliminar
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-xs text-white bg-accent hover:bg-accent-strong rounded-lg transition-colors font-medium">
              {editingRelation ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default RelationEditModal;
