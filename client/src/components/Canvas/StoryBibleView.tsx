import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../context/useProject';
import type { INode, ICharacter } from '../../context/projectTypes';

const stripHtml = (html?: string) => (html || '').replace(/<[^>]*>/g, '');

const StoryBibleView: React.FC = () => {
  const { t } = useTranslation();
  const { project } = useProject();
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

  return (
    <div className="h-full w-full bg-slate-900 overflow-y-auto p-6 pt-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{t('storyBible.title')}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('storyBible.subtitle')}</p>
        </div>

        <section>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">{t('storyBible.projectInfo')}</h2>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-1.5">
            <p className="text-sm text-slate-200 font-medium">{project.metadata.title}</p>
            <p className="text-xs text-slate-500">{t('storyBible.created')}: {new Date(project.metadata.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-slate-500">{t('storyBible.lastModified')}: {new Date(project.metadata.lastModified).toLocaleDateString()}</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">{t('storyBible.characters')} ({characters.length})</h2>
          {characters.length === 0 && (
            <p className="text-xs text-slate-500 italic">{t('storyBible.noCharacters')}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {characters.map((ch: ICharacter) => (
              <div key={ch.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3">
                  {ch.image?.url ? (
                    <img src={ch.image.url} alt={ch.name} className="w-10 h-10 rounded-full object-cover border border-slate-600" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-600">
                      {(ch.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{ch.name}</p>
                  </div>
                </div>
                {ch.biography && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Biografía</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{stripHtml(ch.biography)}</p>
                  </div>
                )}
                {ch.appearance && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Apariencia</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{stripHtml(ch.appearance)}</p>
                  </div>
                )}
                {ch.psychology && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Psicología</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{stripHtml(ch.psychology)}</p>
                  </div>
                )}
                {ch.backstory && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trasfondo</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{stripHtml(ch.backstory)}</p>
                  </div>
                )}
                {ch.stats && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stats</p>
                    <pre className="text-xs text-slate-400 mt-0.5 whitespace-pre-wrap font-sans leading-relaxed">{ch.stats}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">{t('storyBible.chapters')} ({chapters.length})</h2>
          {chapters.length === 0 && nodes.length === 0 && (
            <p className="text-xs text-slate-500 italic">{t('storyBible.noChapters')}</p>
          )}

          {chapters.length === 0 && nodes.length > 0 && (
            <p className="text-xs text-slate-500 italic">Sin capítulos — las tarjetas no están asignadas a ningún capítulo.</p>
          )}

          {chapters.map((ch) => {
            const chNodes = nodesByChapter.get(ch.chapterId) || [];
            return (
              <div key={ch.chapterId} className="mb-6">
                <h3 className="text-sm font-bold text-emerald-300 mb-2">{ch.chapterId}</h3>
                {chNodes.length === 0 && (
                  <p className="text-xs text-slate-500 italic px-3">Sin escenas asignadas.</p>
                )}
                <div className="space-y-2">
                  {chNodes.map((node) => (
                    <div key={node.id} className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 space-y-1.5">
                      <p className="text-sm font-semibold text-blue-300" dangerouslySetInnerHTML={{ __html: node.data.title || 'Sin título' }} />
                      {node.data.content && (
                        <div className="text-xs text-slate-400 leading-relaxed line-clamp-4" dangerouslySetInnerHTML={{ __html: node.data.content }} />
                      )}
                      {node.data.sceneAction && (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Acción de escena</p>
                          <div className="text-xs text-slate-400 italic mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: node.data.sceneAction }} />
                        </div>
                      )}
                      {node.data.stats && (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Stats</p>
                          <pre className="text-xs text-slate-400 mt-0.5 whitespace-pre-wrap font-sans">{node.data.stats}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-400 mb-2">Sin capítulo ({unassigned.length})</h3>
              <div className="space-y-2">
                {unassigned.map((node) => (
                  <div key={node.id} className="bg-slate-800/20 border border-slate-700/20 rounded-lg p-3 space-y-1.5">
                    <p className="text-sm font-semibold text-slate-300" dangerouslySetInnerHTML={{ __html: node.data.title || 'Sin título' }} />
                    {node.data.content && (
                      <div className="text-xs text-slate-500 leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: node.data.content }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StoryBibleView;
