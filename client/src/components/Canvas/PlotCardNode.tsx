import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { INodeData } from '../../context/ProjectContext';
import { useProject } from '../../context/ProjectContext';

// Helper to map color strings to Tailwind classes safely
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
  const { project, activeFocusChapterId } = useProject();
  const nodeData = data as unknown as INodeData;
  const accentClass = getColorAccent(nodeData.color);

  const isFocused = activeFocusChapterId === null || activeFocusChapterId === nodeData.chapterId;

  return (
    <div
      className={`
        relative w-64 rounded-xl border border-white/10
        bg-slate-900/80 backdrop-blur-md overflow-hidden
        transition-all duration-500 ease-in-out cursor-pointer
        ${selected ? 'ring-2 ring-blue-500 scale-105 shadow-2xl' : 'hover:scale-[1.02] hover:border-white/20 shadow-xl'}
        ${selected ? `shadow-[0_0_20px_rgba(59,130,246,0.3)]` : ''}
        ${!isFocused ? 'opacity-20 grayscale pointer-events-none saturate-0' : 'opacity-100'}
      `}
    >
      {/* Top Input Handle */}
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

      {/* Decorative Accent Ribbon Top */}
      <div className={`h-1.5 w-full ${accentClass}`}></div>

      <div className="p-4 flex flex-col gap-3">
        {/* Header: Title and Category Tags */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-slate-100 font-bold text-sm tracking-wide leading-tight line-clamp-2">
            {nodeData.title || 'Untitled Node'}
          </h3>
          
          {/* Category Tag pill mock */}
          {nodeData.categoryTags && nodeData.categoryTags.length > 0 && (
            <div className="shrink-0 flex items-center">
              <span className="px-2 py-0.5 mt-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold uppercase tracking-wider border border-purple-500/30">
                {nodeData.categoryTags[0] === 'gt_1' ? 'Giro' : 'Tag'}
              </span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div 
          className="text-slate-400 text-xs leading-relaxed line-clamp-3 font-medium"
          dangerouslySetInnerHTML={{ __html: (nodeData.content && nodeData.content !== '<p></p>') ? nodeData.content : 'Sin descripción pautada aún para esta trama.' }}
        />

        {/* Footer: Characters associated */}
        {nodeData.characterTags && nodeData.characterTags.length > 0 && (
          <div className="pt-2 mt-1 border-t border-slate-700/50 flex flex-wrap gap-1">
            <span className="text-[9px] text-slate-500 font-medium mr-1 uppercase self-center uppercase tracking-wider">Roles:</span>
            {nodeData.characterTags.map((charId, idx) => {
              const globalChar = project.characters.find(c => c.id === charId);
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
      </div>

      {/* Output Handles */}
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
