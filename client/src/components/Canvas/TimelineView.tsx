import React, { useMemo, useRef, useState } from 'react';
import { useProject } from '../../context/useProject';
import type { INode, ICharacter } from '../../context/projectTypes';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

const NodeChip: React.FC<{ node: INode; characters: ICharacter[] }> = ({ node, characters }) => {
  const preview = stripHtml(node.data.content || '').slice(0, 60);

  return (
    <div className="group relative bg-slate-800 border border-slate-700/30 rounded-lg px-2.5 py-1.5 hover:border-blue-500/40 transition-colors cursor-default">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${
          node.data.color === 'red' ? 'bg-red-500' :
          node.data.color === 'orange' ? 'bg-orange-500' :
          node.data.color === 'yellow' ? 'bg-yellow-500' :
          node.data.color === 'green' ? 'bg-emerald-500' :
          node.data.color === 'blue' ? 'bg-blue-500' :
          node.data.color === 'purple' ? 'bg-purple-500' :
          'bg-slate-500'
        }`} />
        <span className="text-xs font-medium text-blue-300 truncate">{node.data.title}</span>
      </div>
      {preview && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{preview}</p>}
      <div className="flex flex-wrap gap-1 mt-1">
        {(node.data.characterTags || []).map((chId) => {
          const ch = characters.find((c) => c.id === chId);
          return ch ? (
            <span key={chId} className="text-[8px] text-blue-400 bg-blue-900/30 px-1 rounded border border-blue-500/20">
              {ch.name}
            </span>
          ) : null;
        })}
      </div>
    </div>
  );
};

const TimelineView: React.FC = () => {
  const { project, reorderChapters } = useProject();
  const [zoom, setZoom] = useState(100);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const { chapters } = project.chapterManager;
  const { nodes } = project.canvas;
  const { characters } = project;

  const nodesByChapter = useMemo(() => {
    const map = new Map<string, INode[]>();
    const unassigned: INode[] = [];
    for (const node of nodes) {
      const cid = node.data.chapterId || '';
      if (cid) {
        const list = map.get(cid);
        if (list) list.push(node);
        else map.set(cid, [node]);
      } else {
        unassigned.push(node);
      }
    }
    return { byChapter: map, unassigned };
  }, [nodes]);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverIdx.current = idx;
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const reordered = [...chapters];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    reorderChapters(reordered);
    setDraggedIdx(null);
    dragOverIdx.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    dragOverIdx.current = null;
  };

  const totalChapters = chapters.length + (nodesByChapter.unassigned.length > 0 ? 1 : 0);
  const gapPx = 16 + (zoom - 50) * 0.4;

  return (
    <div className="h-full w-full bg-slate-900 overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <span className="text-xs font-medium text-slate-400">Línea de tiempo</span>
        <span className="text-xs text-slate-600">|</span>
        <span className="text-xs text-slate-500">Zoom</span>
        <input
          type="range"
          min={50}
          max={200}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-24 h-1 accent-emerald-500"
        />
        <span className="text-xs text-slate-500 font-mono w-8">{zoom}%</span>
        <span className="text-xs text-slate-600">|</span>
        <span className="text-xs text-slate-500">{totalChapters} bloques</span>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="relative h-full min-h-[300px] p-6">
          {/* Timeline rail */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-700/60" style={{ marginLeft: 40, marginRight: 40 }} />

          <div className="flex items-start gap-6 pt-2" style={{ gap: `${gapPx}px` }}>
            {/* Timeline markers and cards */}
            {chapters.map((ch, idx) => {
              const chNodes = nodesByChapter.byChapter.get(ch.chapterId) || [];
              const isDragging = draggedIdx === idx;

              return (
                <div key={ch.chapterId} className="flex flex-col items-center shrink-0" style={{ width: 220 }}>
                  {/* Timeline dot */}
                  <div className={`w-4 h-4 rounded-full border-2 z-10 mb-3 transition-colors ${
                    isDragging ? 'bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-500/30' : 'bg-slate-800 border-emerald-500'
                  }`} />

                  {/* Chapter card */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`w-full bg-slate-800/60 border rounded-xl overflow-hidden transition-all select-none ${
                      isDragging
                        ? 'border-emerald-500/60 shadow-xl shadow-emerald-500/10 opacity-60 scale-105'
                        : 'border-slate-700/50 hover:border-slate-600/80 hover:shadow-lg'
                    }`}
                  >
                    {/* Chapter header */}
                    <div className="px-3 py-2.5 bg-slate-700/40 border-b border-slate-700/30 flex items-center gap-2 cursor-grab active:cursor-grabbing">
                      <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                      </svg>
                      <span className="text-sm font-bold text-emerald-300 truncate">{ch.chapterId}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full ml-auto">{chNodes.length}</span>
                    </div>

                    {/* Chapter content */}
                    <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                      {/* Beats */}
                      {ch.beats?.map((beat) => (
                        <div key={beat.id} className="text-[10px] text-amber-200 bg-amber-900/20 border border-amber-700/20 px-2 py-1 rounded">
                          <span className="text-amber-500 font-bold mr-1">!</span>
                          {beat.description}
                        </div>
                      ))}

                      {/* Nodes */}
                      {chNodes.length === 0 && !ch.beats?.length && (
                        <p className="text-[10px] text-slate-600 italic text-center py-2">Vacio</p>
                      )}
                      {chNodes.map((node) => (
                        <NodeChip key={node.id} node={node} characters={characters} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unassigned nodes */}
            {nodesByChapter.unassigned.length > 0 && (
              <div className="flex flex-col items-center shrink-0" style={{ width: 220 }}>
                <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-600 bg-slate-800 z-10 mb-3" />
                <div className="w-full bg-slate-800/20 border border-dashed border-slate-700/40 rounded-xl overflow-hidden">
                  <div className="px-3 py-2.5 bg-slate-700/20 border-b border-slate-700/20">
                    <span className="text-sm font-bold text-slate-400">Sin capitulo</span>
                    <span className="text-[10px] text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded-full ml-2">{nodesByChapter.unassigned.length}</span>
                  </div>
                  <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    {nodesByChapter.unassigned.map((node) => (
                      <NodeChip key={node.id} node={node} characters={characters} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
