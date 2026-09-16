import React from 'react';
import { useTranslation } from 'react-i18next';
import { GitBranch } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { useProject } from '../../context/useProject';
import { useUser } from '../../context/UserContext';
import type { INode, ICharacter } from '../../context/projectTypes';

const StoryFlowView: React.FC = () => {
  const { t } = useTranslation();
  const { project } = useProject();
  const { tags } = useUser();
  const { chapters } = project.chapterManager;
  const { nodes } = project.canvas;
  const { characters } = project;

  const nodesByChapter = new Map<string, INode[]>();
  const unassigned: INode[] = [];
  for (const node of nodes) {
    const cid = node.data.chapterId || '';
    if (cid) {
      const list = nodesByChapter.get(cid);
      if (list) list.push(node);
      else nodesByChapter.set(cid, [node]);
    } else {
      unassigned.push(node);
    }
  }

  if (nodes.length === 0) {
    return (
      <div className="h-full w-full bg-slate-900 overflow-y-auto p-6 flex items-center justify-center">
        <EmptyState icon={GitBranch} message={t('storyFlow.noNodes')} />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 overflow-y-auto p-6 pt-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center pb-4 border-b border-slate-700/30">
          <h1 className="text-xl font-bold text-slate-100">{t('storyFlow.title')}</h1>
          <p className="text-xs text-slate-500 mt-1">{project.metadata.title}</p>
        </div>

        {chapters.map((ch) => {
          const chNodes = nodesByChapter.get(ch.chapterId) || [];
          if (chNodes.length === 0) return null;
          return (
            <section key={ch.chapterId}>
              <div className="sticky top-0 bg-slate-900/90 backdrop-blur-sm pb-2 mb-4 z-10">
                <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                  {t('storyFlow.chapter')}: {ch.chapterId}
                </h2>
              </div>
              <div className="space-y-4">
                {chNodes.map((node) => (
                  <CardReader key={node.id} node={node} characters={characters} tags={tags} />
                ))}
              </div>
            </section>
          );
        })}

        {unassigned.length > 0 && (
          <section>
            <div className="sticky top-0 bg-slate-900/90 backdrop-blur-sm pb-2 mb-4 z-10">
              <h2 className="label text-slate-400">Sin capítulo</h2>
            </div>
            <div className="space-y-4">
              {unassigned.map((node) => (
                <CardReader key={node.id} node={node} characters={characters} tags={tags} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

interface CardReaderProps {
  node: INode;
  characters: ICharacter[];
  tags: { tagId: string; label: string; color: string }[];
}

const CardReader: React.FC<CardReaderProps> = ({ node, characters, tags }) => {
  const hasContent = !!node.data.content && node.data.content !== '<p></p>';
  const hasAction = !!node.data.sceneAction && node.data.sceneAction !== '<p></p>';
  const hasStats = !!node.data.stats && node.data.stats.trim().length > 0;

  return (
    <div className={`border-l-4 rounded-r-xl bg-slate-800/40 border border-slate-700/30 border-l-slate-500 p-4 space-y-3 ${
      node.data.color === 'red' ? 'border-l-red-500' :
      node.data.color === 'orange' ? 'border-l-orange-500' :
      node.data.color === 'yellow' ? 'border-l-yellow-500' :
      node.data.color === 'green' ? 'border-l-emerald-500' :
      node.data.color === 'blue' ? 'border-l-blue-500' :
      node.data.color === 'purple' ? 'border-l-purple-500' :
      'border-l-slate-500'
    }`}>
      <div>
        <p className="text-base font-bold text-blue-300" dangerouslySetInnerHTML={{ __html: node.data.title || 'Sin título' }} />
        <p className="text-[10px] text-slate-600 font-mono mt-0.5">ID: {node.id.split('_').pop()}</p>
      </div>

      {hasContent && (
        <div className="text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: node.data.content! }} />
      )}

      {hasAction && (
        <div className="bg-slate-800/60 border border-slate-700/30 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Acción de escena</p>
          <div className="text-sm text-slate-400 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: node.data.sceneAction! }} />
        </div>
      )}

      {hasStats && (
        <div className="bg-slate-800/60 border border-slate-700/30 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Stats</p>
          <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">{node.data.stats}</pre>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {(node.data.characterTags || []).map((chId: string) => {
          const ch = characters.find((c) => c.id === chId);
          return ch ? (
            <span key={chId} className="text-[10px] text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-500/20">
              {ch.name}
            </span>
          ) : null;
        })}
        {(node.data.categoryTags || []).map((tagId: string) => {
          const tag = tags.find((t) => t.tagId === tagId);
          return tag ? (
            <span key={tagId} className="text-[10px] px-1.5 py-0.5 rounded border" style={{ color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}20` }}>
              {tag.label}
            </span>
          ) : null;
        })}
      </div>
    </div>
  );
};

export default StoryFlowView;
