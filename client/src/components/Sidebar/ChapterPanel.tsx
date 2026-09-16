import React, { useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, Crosshair, Minus, Pencil, Plus, X } from 'lucide-react';
import { useProject } from '../../context/useProject';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import { sanitizeRichTextHtml } from '../../lib/sanitizeHtml';
import type { IBeat } from '../../context/projectTypes';

const ChapterPanel: React.FC = () => {
  const { t } = useTranslation();
  const { project, addChapter, updateChapter, removeChapter, addBeat, updateBeat, removeBeat, activeFocusChapterId, setActiveFocusChapterId } = useProject();
  const { chapters } = project.chapterManager;
  const { setCenter, getNode, fitView } = useReactFlow();

  const canvasNodes = project.canvas.nodes;
  const nodesByChapter = useMemo(() => {
    const map = new Map<string, typeof canvasNodes>();
    for (const node of canvasNodes) {
      const chapterId = node.data.chapterId || '';
      const list = map.get(chapterId);
      if (list) {
        list.push(node);
      } else {
        map.set(chapterId, [node]);
      }
    }
    return map;
  }, [canvasNodes]);

  const [isAdding, setIsAdding] = useState(false);
  const [newChapterId, setNewChapterId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChapterId, setEditChapterId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [addingBeat, setAddingBeat] = useState<string | null>(null);
  const [newBeatDesc, setNewBeatDesc] = useState('');
  const [editingBeat, setEditingBeat] = useState<{ chapterId: string; beatId: string } | null>(null);
  const [editBeatDesc, setEditBeatDesc] = useState('');

  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chapterId]: prev[chapterId] === false
    }));
  };

  const isChapterOpen = (chapterId: string) => openChapters[chapterId] !== false;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterId.trim()) return;
    if (chapters.some((chapter) => chapter.chapterId === newChapterId.trim())) return;

    addChapter({
      chapterId: newChapterId.trim(),
      beats: []
    });
    setNewChapterId('');
    setIsAdding(false);
  };

  const handleEditSubmit = (e: React.FormEvent | React.FocusEvent) => {
    e.preventDefault();
    const currentEditId = editingId;
    const currentName = editChapterId.trim();
    if (currentEditId && currentName && currentEditId !== currentName) {
      if (!chapters.some((chapter) => chapter.chapterId === currentName)) {
        updateChapter(currentEditId, currentName);
      }
    }
    setEditingId(null);
  };

  const confirmDeletion = () => {
    if (!deleteId) return;
    removeChapter(deleteId);
    setDeleteId(null);
  };

  const handleNavigateToNode = (nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      setCenter(node.position.x + 125, node.position.y + 125, { duration: 800, zoom: 1.1 });
    }
  };

  const handleFocusChapter = (e: React.MouseEvent, chapterId: string, linkedNodesArr: Node[]) => {
    e.stopPropagation();

    if (activeFocusChapterId === chapterId) {
      setActiveFocusChapterId(null);
      fitView({ duration: 800 });
      return;
    }

    setActiveFocusChapterId(chapterId);
    if (linkedNodesArr.length > 0) {
      fitView({ nodes: linkedNodesArr, duration: 800, padding: 0.2 });
    }
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-lg mb-6 max-h-[500px] flex flex-col transition-all">
      <button
        type="button"
        className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80 cursor-pointer hover:bg-slate-800 transition-colors select-none w-full text-left"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        aria-expanded={isPanelOpen}
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isPanelOpen ? 'rotate-90' : 'rotate-0'}`} />
          <h3 className="label text-purple-400">{t('sidebar.chapters')}</h3>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{chapters.length}</span>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); setIsPanelOpen(true); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setIsAdding(!isAdding); setIsPanelOpen(true); } }}
          aria-label={isAdding ? t('common.cancel') : t('chapters.addChapter')}
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
                value={newChapterId}
                onChange={(e) => setNewChapterId(e.target.value)}
                placeholder={t('chapters.newChapter') + "..."}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
                autoFocus
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                Ok
              </button>
            </form>
          )}

          <div className="p-3 overflow-y-auto space-y-4 grow custom-scrollbar relative">
            {chapters.length === 0 ? (
              <EmptyState icon={BookOpen} message={t('chapters.noChapters')} />
            ) : (
              chapters.map((chapter) => {
                const linkedNodes = nodesByChapter.get(chapter.chapterId) || [];
                const isOpen = isChapterOpen(chapter.chapterId);

                return (
                  <div key={chapter.chapterId} className="group/item border border-slate-700/50 rounded-lg bg-slate-800 flex flex-col relative transition-all">
                    <div
                      onClick={() => toggleChapter(chapter.chapterId)}
                      className="py-2 flex items-center gap-2 px-3 border-b border-slate-700/50 bg-slate-800 font-sans tracking-wide pr-8 cursor-pointer hover:bg-slate-700 transition-colors"
                    >
                      <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
                      <div>
                        {editingId === chapter.chapterId ? (
                          <form onSubmit={handleEditSubmit} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editChapterId}
                              onChange={(e) => setEditChapterId(e.target.value)}
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-sm text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 w-32"
                              autoFocus
                              onBlur={handleEditSubmit}
                            />
                          </form>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-slate-300">{t('chapters.chapter')}: </span>
                            <span className="text-sm font-bold text-emerald-300">{chapter.chapterId}</span>
                          </>
                        )}
                      </div>
                      <div className="ml-auto mr-7 flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(chapter.chapterId); setEditChapterId(chapter.chapterId); }}
                          className="text-slate-500 hover:text-emerald-400 hover:bg-slate-700 p-1 rounded-sm transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleFocusChapter(e, chapter.chapterId, linkedNodes)}
                          className={`p-1 rounded transition-colors ${activeFocusChapterId === chapter.chapterId ? 'text-yellow-400 bg-yellow-400/20' : 'text-slate-500 hover:text-yellow-200 hover:bg-slate-700'}`}
                          title={activeFocusChapterId === chapter.chapterId ? t('canvas.removeFocus') : t('canvas.focusChapter')}
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700 ml-1">
                          {linkedNodes.length} {t('chapters.beats')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(chapter.chapterId); }}
                      className="absolute right-2 top-1.5 text-slate-500 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 z-10"
                      title={t('chapters.deleteChapter')}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {isOpen && (
                      <div className="py-2 px-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {chapter.beats.map((beat) => (
                          <div key={beat.id} className="bg-slate-900 border border-slate-700/50 rounded-lg p-2 space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                              {editingBeat?.chapterId === chapter.chapterId && editingBeat?.beatId === beat.id ? (
                                <form
                                  onSubmit={(e) => { e.preventDefault(); updateBeat(chapter.chapterId, beat.id, { description: editBeatDesc }); setEditingBeat(null); }}
                                  className="flex-1 flex gap-1"
                                >
                                  <input
                                    type="text"
                                    value={editBeatDesc}
                                    onChange={(e) => setEditBeatDesc(e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
                                    autoFocus
                                    onBlur={() => setEditingBeat(null)}
                                  />
                                </form>
                              ) : (
                                <button
                                  type="button"
                                  className="text-xs text-slate-300 flex-1 cursor-pointer hover:text-white text-left"
                                  onClick={() => { setEditingBeat({ chapterId: chapter.chapterId, beatId: beat.id }); setEditBeatDesc(beat.description); }}
                                >
                                  {beat.description || <span className="text-slate-500 italic">{t('chapters.noDescription')}</span>}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeBeat(chapter.chapterId, beat.id)}
                                className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                aria-label={t('chapters.deleteBeat')}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            {beat.linkedNodes.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-3">
                                {beat.linkedNodes.map((nodeId) => {
                                  const n = canvasNodes.find((cn) => cn.id === nodeId);
                                  return n ? (
                                    <button
                                      key={nodeId}
                                      onClick={() => handleNavigateToNode(nodeId)}
                                      className="text-[10px] text-blue-300 hover:text-blue-200 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 hover:border-blue-500 transition-colors"
                                    >
                                      {sanitizeRichTextHtml(n.data.title, nodeId.split('_').pop() || '?')}
                                    </button>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        ))}

                        {addingBeat === chapter.chapterId ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!newBeatDesc.trim()) return;
                              const newBeat: IBeat = { id: `beat_${Date.now()}`, description: newBeatDesc.trim(), linkedNodes: [] };
                              addBeat(chapter.chapterId, newBeat);
                              setNewBeatDesc('');
                              setAddingBeat(null);
                            }}
                            className="flex gap-1"
                          >
                            <input
                              type="text"
                              value={newBeatDesc}
                              onChange={(e) => setNewBeatDesc(e.target.value)}
                              placeholder={t('chapters.beatDescription') + "..."}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
                              autoFocus
                            />
                            <button type="submit" aria-label={t('common.create')} className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                            <button type="button" onClick={() => { setAddingBeat(null); setNewBeatDesc(''); }} aria-label={t('common.cancel')} className="text-slate-500 hover:text-white p-1 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                          </form>
                        ) : (
                          <button
                            onClick={() => setAddingBeat(chapter.chapterId)}
                            className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors w-full text-left px-1"
                          >
                            + {t('chapters.addBeat')}
                          </button>
                        )}

                        {linkedNodes.length === 0 && chapter.beats.length === 0 && (
                          <p className="text-xs text-slate-500 italic">{t('chapters.noNodesLinked')}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title={t('chapters.deleteChapter')}
        message={t('chapters.deleteConfirm')}
        onConfirm={confirmDeletion}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default ChapterPanel;
