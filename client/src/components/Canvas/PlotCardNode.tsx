import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { INodeData } from '../../context/projectTypes';
import { useProjectData } from '../../context/useProject';
import { useUser } from '../../context/UserContext';
import { sanitizeRichTextHtml } from '../../lib/sanitizeHtml';

const getColorAccent = (colorName?: string) => {
  switch (colorName?.toLowerCase()) {
    case 'red': return 'bg-red-500 shadow-red-500/20';
    case 'orange': return 'bg-orange-500 shadow-orange-500/20';
    case 'yellow': return 'bg-yellow-500 shadow-yellow-500/20';
    case 'green': return 'bg-emerald-500 shadow-emerald-500/20';
    case 'blue': return 'bg-blue-500 shadow-blue-500/20';
    case 'purple': return 'bg-purple-500 shadow-purple-500/20';
    default: return 'bg-slate-500 shadow-slate-500/20';
  }
};

const PlotCardNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { project, activeFocusChapterId, activeFilterCharId } = useProjectData();
  const { tags } = useUser();
  const nodeData = data as INodeData;
  const accentClass = getColorAccent(nodeData.color);
  const safeTitleHtml = sanitizeRichTextHtml(nodeData.title, 'Untitled Node');
  const safeContentHtml = sanitizeRichTextHtml(nodeData.content, 'Sin descripcion pautada aun para esta trama.');
  const safeSceneActionHtml = sanitizeRichTextHtml(nodeData.sceneAction);

  const [expanded, setExpanded] = useState(false);

  const isFocused = activeFocusChapterId === null || activeFocusChapterId === nodeData.chapterId;
  const isFiltered = activeFilterCharId !== null && !(nodeData.characterTags || []).includes(activeFilterCharId);
  const isSearched = (nodeData as any).dimmed === true;
  const isDimmed = !isFocused || isFiltered || isSearched;

  return (
    <div
      className={`
        relative w-64 rounded-xl border border-white/10
        bg-slate-900/80 backdrop-blur-md overflow-hidden
        transition-all duration-500 ease-in-out cursor-pointer
        ${selected ? 'ring-2 ring-blue-500 scale-105 shadow-2xl' : 'hover:scale-[1.02] hover:border-white/20 shadow-xl'}
        ${selected ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}
        ${isDimmed ? 'opacity-20 grayscale pointer-events-none saturate-0' : 'opacity-100'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-slate-900 bg-white"
        id="input_top"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-slate-900 bg-white"
        id="input_left"
      />

      <div className={`h-1.5 w-full ${accentClass}`}></div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <h3
            className="text-slate-100 font-bold text-sm tracking-wide leading-tight line-clamp-2"
            dangerouslySetInnerHTML={{ __html: safeTitleHtml }}
          />

          {nodeData.categoryTags && nodeData.categoryTags.length > 0 && (
            <div className="shrink-0 flex flex-wrap gap-1 items-start max-w-[100px]">
              {nodeData.categoryTags.map((tagId) => {
                const tag = tags.find((t) => t.tagId === tagId);
                return tag ? (
                  <span
                    key={tagId}
                    className="px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider border"
                    style={{
                      backgroundColor: `${tag.color}30`,
                      color: tag.color,
                      borderColor: `${tag.color}50`,
                    }}
                  >
                    {tag.label}
                  </span>
                ) : (
                  <span
                    key={tagId}
                    className="px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider border bg-purple-500/20 text-purple-300 border-purple-500/30"
                  >
                    {tagId}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="text-slate-400 text-xs leading-relaxed line-clamp-3 font-medium"
          dangerouslySetInnerHTML={{ __html: safeContentHtml }}
        />

        {nodeData.characterTags && nodeData.characterTags.length > 0 && (
          <div className="pt-2 mt-1 border-t border-slate-700/50 flex flex-wrap gap-1">
            <span className="text-[9px] text-slate-500 font-medium mr-1 uppercase self-center tracking-wider">Roles:</span>
            {nodeData.characterTags.map((charId, idx) => {
              const globalChar = project.characters.find((char) => char.id === charId);
              return (
                <span
                  key={`${charId}-${idx}`}
                  className="px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-500/30 text-[9px] font-semibold text-blue-200"
                >
                  {globalChar?.name || 'Desconocido'}
                </span>
              );
            })}
          </div>
        )}

        <div className="pt-2 mt-1 border-t border-slate-700/50">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex items-center gap-1.5 w-full text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span>
            Acción de escena
            {!expanded && safeSceneActionHtml.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] shrink-0" />
            )}
          </button>

          {expanded && nodeData.sceneAction && nodeData.sceneAction !== '<p></p>' && (
            <div
              className="mt-1.5 text-[11px] text-slate-400 leading-relaxed italic max-h-40 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150"
              dangerouslySetInnerHTML={{ __html: safeSceneActionHtml }}
            />
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-slate-900 bg-white"
        id="output_bottom"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-slate-900 bg-white"
        id="output_right_1"
      />
    </div>
  );
};

export default memo(PlotCardNode);
