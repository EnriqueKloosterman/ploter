import React, { useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useProject } from '../../context/useProject';
import { useUser } from '../../context/UserContext';
import { sanitizeRichTextHtml } from '../../lib/sanitizeHtml';
import type { INode, ICharacter } from '../../context/projectTypes';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

const OutlineView: React.FC = () => {
  const { project } = useProject();
  const { tags } = useUser();
  const { setCenter, getNode } = useReactFlow();
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [openUnassigned, setOpenUnassigned] = useState(true);

  const { chapters } = project.chapterManager;
  const { nodes } = project.canvas;
  const { characters } = project;

  const nodesByChapter = useMemo(() => {
    const map = new Map<string, typeof nodes>();
    const unassigned: typeof nodes = [];
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

  const toggleChapter = (id: string) => setOpenChapters((prev) => ({ ...prev, [id]: prev[id] === false }));

  const handleNodeClick = (nodeId: string) => {
    const rfNode = getNode(nodeId);
    if (rfNode) {
      setCenter(rfNode.position.x + 125, rfNode.position.y + 125, { duration: 500, zoom: 1.5 });
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-lg font-bold text-slate-200 tracking-wide">Esquema del Proyecto</h2>

        {chapters.length === 0 && nodesByChapter.unassigned.length === 0 && (
          <p className="text-sm text-slate-500 italic">El proyecto esta vacio. Crea nodos y capitulos desde el panel lateral.</p>
        )}

        {chapters.map((ch) => {
          const chNodes = nodesByChapter.byChapter.get(ch.chapterId) || [];
          const isOpen = openChapters[ch.chapterId] !== false;

          return (
            <div key={ch.chapterId} className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-800/40">
              <button
                onClick={() => toggleChapter(ch.chapterId)}
                className="w-full px-4 py-3 flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700/80 transition-colors text-left"
              >
                <span className={`text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>{'>'}</span>
                <span className="text-sm font-bold text-emerald-300">{ch.chapterId}</span>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full ml-auto">{chNodes.length} escenas</span>
              </button>

              {isOpen && (
                <div className="divide-y divide-slate-700/30">
                  {chNodes.length === 0 && (
                    <p className="text-xs text-slate-500 italic px-4 py-3">Sin escenas asignadas.</p>
                  )}
                  {chNodes.map((node) => (
                    <NodeRow key={node.id} node={node} characters={characters} tags={tags} onClick={handleNodeClick} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {nodesByChapter.unassigned.length > 0 && (
          <div className="border border-slate-700/30 rounded-xl overflow-hidden bg-slate-800/20">
            <button
              onClick={() => setOpenUnassigned((v) => !v)}
              className="w-full px-4 py-3 flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-left"
            >
              <span className={`text-slate-400 text-xs transition-transform ${openUnassigned ? 'rotate-90' : ''}`}>{'>'}</span>
              <span className="text-sm font-bold text-slate-400">Sin capitulo</span>
              <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full ml-auto">{nodesByChapter.unassigned.length} escenas</span>
            </button>

            {openUnassigned && (
              <div className="divide-y divide-slate-700/20">
                {nodesByChapter.unassigned.map((node) => (
                  <NodeRow key={node.id} node={node} characters={characters} tags={tags} onClick={handleNodeClick} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface NodeRowProps {
  node: INode;
  characters: ICharacter[];
  tags: { tagId: string; label: string; color: string }[];
  onClick: (nodeId: string) => void;
}

const NodeRow: React.FC<NodeRowProps> = ({ node, characters, tags, onClick }) => {
  const preview = stripHtml(node.data.content || '').slice(0, 120);

  return (
    <div
      className="px-4 py-3 hover:bg-slate-700/30 cursor-pointer transition-colors"
      onClick={() => onClick(node.id)}
    >
      <div className="flex items-start gap-3">
        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
          node.data.color === 'red' ? 'bg-red-500' :
          node.data.color === 'orange' ? 'bg-orange-500' :
          node.data.color === 'yellow' ? 'bg-yellow-500' :
          node.data.color === 'green' ? 'bg-emerald-500' :
          node.data.color === 'blue' ? 'bg-blue-500' :
          node.data.color === 'purple' ? 'bg-purple-500' :
          'bg-slate-500'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-300 truncate" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(node.data.title, 'Sin titulo') }} />
          {preview && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{preview}</p>}

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {(node.data.characterTags || []).map((chId: string) => {
              const ch = characters.find((c) => c.id === chId);
              return ch ? (
                <span key={chId} className="text-[9px] text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-500/20">
                  {ch.name}
                </span>
              ) : null;
            })}
            {(node.data.categoryTags || []).map((tagId: string) => {
              const tag = tags.find((t) => t.tagId === tagId);
              return tag ? (
                <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}20` }}>
                  {tag.label}
                </span>
              ) : null;
            })}
          </div>

          <p className="text-[9px] text-slate-600 font-mono mt-1">ID: {node.id.split('_').pop()}</p>
        </div>
      </div>
    </div>
  );
};

export default OutlineView;
