import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../context/useProject';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

const ProjectStats: React.FC = () => {
  const { t } = useTranslation();
  const { project } = useProject();

  const stats = useMemo(() => {
    const nodes = project.canvas.nodes;
    const chars = project.characters;
    const chapters = project.chapterManager.chapters;
    const edges = project.canvas.edges;

    let totalChars = 0;
    for (const node of nodes) {
      totalChars += stripHtml(node.data.content || '').length;
      totalChars += stripHtml(node.data.title || '').length;
    }

    return [
      { label: t('stats.nodes'), value: nodes.length, color: 'text-blue-400' },
      { label: t('stats.edges'), value: edges.length, color: 'text-pink-400' },
      { label: t('stats.characters'), value: chars.length, color: 'text-emerald-400' },
      { label: t('stats.chapters'), value: chapters.length, color: 'text-purple-400' },
      { label: t('stats.chars'), value: totalChars.toLocaleString(), color: 'text-amber-400' },
    ];
  }, [project]);

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg mb-6">
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{t('stats.title')}</h3>
      </div>
      <div className="p-3 space-y-2">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="flex justify-between items-center px-2 py-1 rounded bg-slate-800/40">
            <span className="text-xs text-slate-400">{label}</span>
            <span className={`text-sm font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectStats;
