import React, { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';

const CharacterNode: React.FC<NodeProps> = ({ data }) => {
  const { label, image, color } = data as { label?: string; image?: string; color?: string };
  const initial = (label || '?').charAt(0).toUpperCase();

  return (
    <div className={`px-4 py-3 rounded-2xl shadow-lg border-2 min-w-[140px] text-center transition-all hover:shadow-xl hover:scale-105 bg-slate-800 ${color ? `border-${color}-500/60` : 'border-slate-600'}`}
      style={color ? { borderColor: `${color}80` } : undefined}>
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-3 !h-3 !border-2 !border-slate-800" />
      <div className="flex flex-col items-center gap-2">
        {image ? (
          <img src={image} alt={label || ''} className="w-12 h-12 rounded-full object-cover border-2 border-slate-600" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-300 border-2 border-slate-600">
            {initial}
          </div>
        )}
        <span className="text-sm font-bold text-slate-100 truncate max-w-[120px]">{label || '?'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-3 !h-3 !border-2 !border-slate-800" />
    </div>
  );
};

export default memo(CharacterNode);
