import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useProject } from '../../context/ProjectContext';
import ConfirmModal from '../ui/ConfirmModal';

const ChapterPanel: React.FC = () => {
  const { project, addChapter, updateChapter, removeChapter, activeFocusChapterId, setActiveFocusChapterId } = useProject();
  const { chapters } = project.chapterManager;
  const { setCenter, getNode, fitView } = useReactFlow();

  const [isAdding, setIsAdding] = useState(false);
  const [newChapterId, setNewChapterId] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChapterId, setEditChapterId] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Control de estado para desplegables (Acordeones) [chapterId: isOpen]
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (chapterId: string) => {
    setOpenChapters(prev => ({
      ...prev,
      [chapterId]: prev[chapterId] === false ? true : false
    }));
  };

  const isChapterOpen = (chapterId: string) => {
    return openChapters[chapterId] !== false; // Abierto por defecto
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterId.trim()) return;
    
    // Validar duplicados básicos
    if (chapters.some(c => c.chapterId === newChapterId.trim())) return;

    addChapter({
      chapterId: newChapterId.trim(),
      beats: []
    });
    setNewChapterId('');
    setIsAdding(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editChapterId.trim() && editingId !== editChapterId.trim()) {
      // Avoid duplicate names mapping
      if (!chapters.some(c => c.chapterId === editChapterId.trim())) {
        updateChapter(editingId, editChapterId.trim());
      }
    }
    setEditingId(null);
  };

  const confirmDeletion = () => {
    if (deleteId) {
      removeChapter(deleteId);
      setDeleteId(null);
    }
  };

  const handleNavigateToNode = (nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      // Centra geométricamente contando el ancho estandar de tajeta (w-64 aprox 250px => 125 offset)
      setCenter(node.position.x + 125, node.position.y + 125, { duration: 800, zoom: 1.1 });
    }
  };

  const handleFocusChapter = (e: React.MouseEvent, chapterId: string, linkedNodesArr: any[]) => {
    e.stopPropagation();
    if (activeFocusChapterId === chapterId) {
      // Desactivar Focus
      setActiveFocusChapterId(null);
      fitView({ duration: 800 });
    } else {
      // Activar Focus
      setActiveFocusChapterId(chapterId);
      if (linkedNodesArr.length > 0) {
        // XYFlow fitView acepta filtro de nodos a través de nodes prop opcional
        fitView({ nodes: linkedNodesArr, duration: 800, padding: 0.2 });
      }
    }
  };

  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg mb-6 max-h-[500px] flex flex-col transition-all">
      <div 
        className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80 cursor-pointer hover:bg-slate-750 transition-colors select-none"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
      >
        <div className="flex items-center gap-2">
          <span className={`text-slate-400 text-xs transition-transform ${isPanelOpen ? 'rotate-90' : 'rotate-0'}`}>▶</span>
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-widest">Capítulos & Beats</h3>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{chapters.length}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); setIsPanelOpen(true); }}
          className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600 rounded-md w-6 h-6 flex items-center justify-center font-bold"
          title="Añadir Capítulo"
        >
          {isAdding ? '−' : '+'}
        </button>
      </div>

      {isPanelOpen && (
        <>
          {isAdding && (
            <form onSubmit={handleAddSubmit} className="p-3 border-b border-slate-700/50 bg-slate-850 flex gap-2">
              <input 
                type="text" 
                value={newChapterId}
                onChange={(e) => setNewChapterId(e.target.value)}
                placeholder="Título (Ej. Acto 1)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoFocus
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                Ok
              </button>
            </form>
          )}

          <div className="p-3 overflow-y-auto space-y-4 grow custom-scrollbar relative">
            {chapters.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">No hay capítulos asignados aún.</p>
            ) : (
              chapters.map((chapter) => {
                const linkedNodes = project.canvas.nodes.filter(n => n.data.chapterId === chapter.chapterId);
                const isOpen = isChapterOpen(chapter.chapterId);
                
                return (
                  <div key={chapter.chapterId} className="group/item border border-slate-700/50 rounded-lg bg-slate-800 flex flex-col relative transition-all">
                    
                    {/* Header de Capítulo (Clickeable Accordion) */}
                    <div 
                      onClick={() => toggleChapter(chapter.chapterId)}
                      className="py-2 flex items-center gap-2 px-3 border-b border-slate-700/50 bg-slate-750 font-sans tracking-wide pr-8 cursor-pointer hover:bg-slate-700 transition-colors"
                    >
                      <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                        ▶
                      </span>
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
                            <span className="text-xs font-bold text-slate-300">Capítulo: </span>
                            <span className="text-sm font-bold text-emerald-300">{chapter.chapterId}</span>
                          </>
                        )}
                      </div>
                      <div className="ml-auto mr-7 flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingId(chapter.chapterId); setEditChapterId(chapter.chapterId); }}
                          className="text-slate-500 hover:text-emerald-400 hover:bg-slate-700 p-1 rounded-sm transition-colors"
                          title="Editar Título"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={(e) => handleFocusChapter(e, chapter.chapterId, linkedNodes)}
                          className={`text-xs p-1 rounded transition-colors ${activeFocusChapterId === chapter.chapterId ? 'text-yellow-400 bg-yellow-400/20' : 'text-slate-500 hover:text-yellow-200 hover:bg-slate-700'}`}
                          title={activeFocusChapterId === chapter.chapterId ? "Quitar Foco" : "Enfocar Acto en el Mapa"}
                        >
                          👁️
                        </button>
                        <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700 ml-1">
                          {linkedNodes.length} Beats
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(chapter.chapterId); }}
                      className="absolute right-2 top-1.5 text-slate-500 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 z-10"
                      title="Borrar Capítulo"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Lista de Beats del Capítulo */}
                    {isOpen && (
                      <div className="py-2 px-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {linkedNodes.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No tiene Tarjetas vinculadas.</p>
                        ) : (
                          linkedNodes.map((node) => (
                            <div key={node.id} className="relative flex items-start pl-4 py-1 group/beat">
                              {/* Sub-node visual bullet */}
                              <span className="absolute left-0 top-3 block w-2 h-2 rounded-full border-2 border-emerald-500/50 bg-slate-800" />
                              <div className="border-l-2 border-slate-700/50 absolute left-1 top-4 h-full" style={{ zIndex: 0 }} />
                              
                              <div 
                                onClick={() => handleNavigateToNode(node.id)}
                                className="flex-1 bg-slate-900/80 border mb-2 border-slate-700/50 px-3 py-2 rounded-r-lg rounded-bl-lg shadow-sm z-10 hover:border-blue-500 hover:bg-slate-800 transition-all cursor-pointer group-hover/beat:translate-x-1"
                                title="Haz Clic para centrar vista en esta escena"
                              >
                                <p className="text-xs font-semibold text-blue-300 mb-1 leading-tight line-clamp-2" dangerouslySetInnerHTML={{ __html: (node.data.title && node.data.title !== '<p></p>') ? node.data.title : 'Escena sin título' }} />
                                <p className="text-[9px] text-slate-500 font-mono">
                                  ID: {node.id.split('_').pop()}
                                </p>
                              </div>
                            </div>
                          ))
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
        title="Eliminar Capítulo"
        message="¿Seguro que deseas eliminar este Acto/Capítulo y su estructura?"
        onConfirm={confirmDeletion}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default ChapterPanel;
