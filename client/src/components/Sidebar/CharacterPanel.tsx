import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Eye, Link2, Minus, Pencil, Plus, Users, X } from 'lucide-react';
import { useProject } from '../../context/useProject';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { uploadImage } from '../../lib/upload';
import { apiUrl } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const CharacterPanel: React.FC = () => {
  const { t } = useTranslation();
  const { project, addCharacter, updateCharacter, removeCharacter, activeFilterCharId, setActiveFilterCharId } = useProject();
  const { characters } = project;
  const { showToast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCharName, setEditCharName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editImageId, setEditImageId] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingCharIdRef = useRef<string | null>(null);

  const handleFilePick = async (charId: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(t('common.imageUploadError'), 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(t('errors.imageSizeLimit'), 'error');
      return;
    }
    setUploadingId(charId);
    try {
      const url = await uploadImage(file);
      updateCharacter(charId, { image: { url, width: 0, height: 0 } });
      showToast(t('common.imageUpdated'), 'success');
    } catch {
      showToast('Error al subir la imagen', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, charId: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    await handleFilePick(charId, file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    addCharacter({
      id: `char_${Date.now()}`,
      name: newCharName.trim()
    });
    setNewCharName('');
    setIsAdding(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editCharName.trim()) {
      updateCharacter(editingId, { name: editCharName.trim() });
    }
    setEditingId(null);
  };

  const confirmDeletion = () => {
    if (!deleteId) return;
    removeCharacter(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-lg mb-6 max-h-64 flex flex-col transition-all">
      <button
        type="button"
        className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80 cursor-pointer hover:bg-slate-800 transition-colors select-none w-full text-left"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        aria-expanded={isPanelOpen}
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isPanelOpen ? 'rotate-90' : 'rotate-0'}`} />
          <h3 className="label text-blue-400">{t('sidebar.characters')}</h3>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{characters.length}</span>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); setIsPanelOpen(true); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setIsAdding(!isAdding); setIsPanelOpen(true); } }}
          aria-label={isAdding ? t('common.cancel') : t('characters.addCharacter')}
          className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600 rounded-md w-7 h-7 flex items-center justify-center"
        >
            {isAdding ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </span>
      </button>

      {isPanelOpen && (
        <>
          {isAdding && (
            <form onSubmit={handleAddSubmit} className="p-3 border-b border-slate-700/50 bg-slate-900 flex gap-2">
              <input
                type="text"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                placeholder="Nombre..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
                autoFocus
              />
              <button type="submit" className="bg-accent hover:bg-accent-strong text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                Ok
              </button>
            </form>
          )}

          <div className="p-3 overflow-y-auto space-y-2 grow relative group">
            {characters.length === 0 ? (
              <EmptyState icon={Users} message={t('characters.noCharacters')} />
            ) : (
              characters.map((char) => (
                <div key={char.id} className="bg-slate-800 rounded-lg border border-transparent hover:border-slate-600 transition-colors px-0 pb-0">
                  <div className="flex items-center gap-3 p-2 group/item relative hover:bg-slate-800">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full bg-slate-700 shrink-0 overflow-hidden border-2 border-slate-600 cursor-pointer relative group/avatar p-0"
                      onClick={() => {
                        pendingCharIdRef.current = char.id;
                        fileInputRef.current?.click();
                      }}
                      onDrop={(e) => handleDrop(e, char.id)}
                      onDragOver={handleDragOver}
                      aria-label={`${char.name}: click para seleccionar imagen, o arrastra una aqui`}
                    >
                      {uploadingId === char.id ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Spinner size="sm" />
                        </div>
                      ) : char.image?.url ? (
                        <img src={char.image.url.startsWith('http') ? char.image.url : apiUrl(char.image.url)} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          {char.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] text-white font-semibold gap-0.5 pointer-events-none">
                        <span>Subir</span>
                        <span className="text-[10px] text-slate-300 font-normal">o arrastrar</span>
                      </div>
                    </button>
                    <div className="flex-1 min-w-0 pr-6">
                      {editingId === char.id ? (
                        <form onSubmit={handleEditSubmit} className="flex items-center">
                          <input
                            type="text"
                            value={editCharName}
                            onChange={(e) => setEditCharName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-accent"
                            autoFocus
                            onBlur={handleEditSubmit}
                          />
                        </form>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-200 truncate">{char.name}</p>
                          <p className="text-xs text-slate-500 truncate">ID: {char.id}</p>
                        </>
                      )}
                      {editImageId === char.id && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            updateCharacter(char.id, { image: editImageUrl.trim() ? { url: editImageUrl.trim(), width: 0, height: 0 } : undefined });
                            setEditImageId(null);
                          }}
                          className="mt-1 flex gap-1"
                        >
                          <input
                            type="text"
                            value={editImageUrl}
                            onChange={(e) => setEditImageUrl(e.target.value)}
                            placeholder="URL de imagen..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
                            autoFocus
                            onBlur={() => setEditImageId(null)}
                          />
                        </form>
                      )}
                    </div>
                    <div className="absolute right-2 text-slate-500 opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1 bg-slate-800 p-1">
                      <button
                        onClick={() => { setEditingId(char.id); setEditCharName(char.name); }}
                        className="hover:text-emerald-400 hover:bg-slate-700 p-1 rounded-sm"
                        title="Editar nombre"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditImageId(editImageId === char.id ? null : char.id); setEditImageUrl(char.image?.url || ''); }}
                        className="hover:text-blue-400 hover:bg-slate-700 p-1 rounded-sm"
                        title="Pegar URL de imagen"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveFilterCharId(activeFilterCharId === char.id ? null : char.id)}
                        className={`p-1 rounded-sm transition-colors ${activeFilterCharId === char.id ? 'text-blue-400 bg-blue-500/20' : 'hover:text-blue-400 hover:bg-slate-700'}`}
                        title={activeFilterCharId === char.id ? 'Quitar lente de trama' : 'Activar lente de trama'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(char.id)}
                        className="hover:text-red-500 hover:bg-slate-700 p-1 rounded-sm"
                        title={t('characters.deleteCharacter')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedCharId(expandedCharId === char.id ? null : char.id)}
                    className="w-full text-[10px] text-slate-500 hover:text-slate-300 transition-colors pb-1 pt-0.5"
                  >
                    {expandedCharId === char.id ? '▲ Ocultar detalles' : '▼ Detalles'}
                  </button>
                  {expandedCharId === char.id && (
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-700/30 pt-2">
                      <textarea value={char.biography || ''} onChange={(e) => updateCharacter(char.id, { biography: e.target.value })} placeholder="Biografia..." rows={2} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
                      <textarea value={char.appearance || ''} onChange={(e) => updateCharacter(char.id, { appearance: e.target.value })} placeholder="Apariencia..." rows={2} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
                      <textarea value={char.psychology || ''} onChange={(e) => updateCharacter(char.id, { psychology: e.target.value })} placeholder="Psicologia..." rows={2} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
                      <textarea value={char.backstory || ''} onChange={(e) => updateCharacter(char.id, { backstory: e.target.value })} placeholder="Historia previa..." rows={2} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
                      <textarea value={char.stats || ''} onChange={(e) => updateCharacter(char.id, { stats: e.target.value })} placeholder="Estadisticas..." rows={3} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Eliminar Personaje"
        message={t('characters.deleteConfirm')}
        onConfirm={confirmDeletion}
        onCancel={() => setDeleteId(null)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const id = pendingCharIdRef.current;
          const file = e.target.files?.[0];
          if (id && file) handleFilePick(id, file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default CharacterPanel;
