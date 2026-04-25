import React, { useEffect, useState } from 'react';
import type { Node } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import type { INodeData } from '../../context/projectTypes';
import { useProject } from '../../context/useProject';
import ConfirmModal from '../ui/ConfirmModal';
import RichTextEditor from '../ui/RichTextEditor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  onSave: (nodeId: string, newData: INodeData) => void;
}

const getFormDataFromNode = (node: Node | null): Partial<INodeData> => {
  if (!node) return {};

  const nodeData = node.data as INodeData;

  return {
    title: nodeData.title || '',
    content: nodeData.content || '',
    color: nodeData.color || 'slate',
    characterTags: nodeData.characterTags || [],
    chapterId: nodeData.chapterId || ''
  };
};

const PlotNodeModal: React.FC<Props> = ({ isOpen, onClose, node, onSave }) => {
  const [formData, setFormData] = useState<Partial<INodeData>>(() => getFormDataFromNode(node));
  const { project } = useProject();
  const { deleteElements } = useReactFlow();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setFormData(getFormDataFromNode(node));
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(node.id, { ...(node.data as INodeData), ...formData } as INodeData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-white/10 bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100 font-sans tracking-wide">Editar Tarjeta</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Titulo</label>
            <div className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <RichTextEditor
                key={`title-${node.id}`}
                content={formData.title || ''}
                onChange={(newTitle) => setFormData({ ...formData, title: newTitle })}
                placeholder="Ej. El Descubrimiento"
                minimal={true}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripcion / Contenido</label>
            <div className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <RichTextEditor
                key={`content-${node.id}`}
                content={formData.content || ''}
                onChange={(newContent) => setFormData({ ...formData, content: newContent })}
                placeholder="Escribe la sinopsis del evento..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Color</label>
            <div className="flex gap-3">
              {['slate', 'blue', 'green', 'yellow', 'orange', 'red', 'purple'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    formData.color === color ? 'border-white scale-125' : 'border-transparent hover:scale-110'
                  }
                    ${color === 'slate' ? 'bg-slate-500' : ''}
                    ${color === 'blue' ? 'bg-blue-500' : ''}
                    ${color === 'green' ? 'bg-emerald-500' : ''}
                    ${color === 'yellow' ? 'bg-yellow-500' : ''}
                    ${color === 'orange' ? 'bg-orange-500' : ''}
                    ${color === 'red' ? 'bg-red-500' : ''}
                    ${color === 'purple' ? 'bg-purple-500' : ''}
                  `}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Personajes Vinculados</label>
            {project.characters.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay personajes globales dados de alta.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {project.characters.map((char) => {
                  const isSelected = formData.characterTags?.includes(char.id);

                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        const tags = formData.characterTags || [];
                        const newTags = isSelected
                          ? tags.filter((id) => id !== char.id)
                          : [...tags, char.id];
                        setFormData({ ...formData, characterTags: newTags });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}
                    >
                      {char.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pb-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Acto / Capitulo raiz</label>
            <select
              value={formData.chapterId || ''}
              onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">-- No asignado a un Capitulo --</option>
              {project.chapterManager.chapters.map((chapter) => (
                <option key={chapter.chapterId} value={chapter.chapterId}>
                  {chapter.chapterId}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 mt-2 flex justify-between gap-3 border-t border-slate-800 items-center">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="text-red-500 hover:text-red-400 text-xs font-bold uppercase transition-colors px-2 py-1 rounded border border-transparent hover:border-red-500/30"
            >
              Borrar Tarjeta
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all font-sans"
              >
                Aplicar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Eliminar Tarjeta"
        message="Seguro que deseas borrar esta tarjeta del lienzo?"
        onConfirm={() => {
          deleteElements({ nodes: [{ id: node.id }] });
          setIsConfirmOpen(false);
          onClose();
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

export default PlotNodeModal;
