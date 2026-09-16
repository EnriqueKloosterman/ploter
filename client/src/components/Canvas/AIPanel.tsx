import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../context/useProject';
import { apiFetch } from '../../lib/api';

interface AiResult {
  label: string;
  loading: boolean;
  data: string | string[] | null;
  error: string | null;
}

type AiKey = 'plot' | 'names' | 'holes' | 'summary';

const initialResults: Record<AiKey, AiResult> = {
  plot: { label: 'Sugerencias de trama', loading: false, data: null, error: null },
  names: { label: 'Generar nombres', loading: false, data: null, error: null },
  holes: { label: 'Huecos argumentales', loading: false, data: null, error: null },
  summary: { label: 'Resumen', loading: false, data: null, error: null },
};

const AIPanel: React.FC = () => {
  const { t } = useTranslation();
  const { project } = useProject();
  const [results, setResults] = useState<Record<AiKey, AiResult>>(initialResults);
  const [namesCount, setNamesCount] = useState(5);
  const [namesStyle, setNamesStyle] = useState('');
  const [plotFocus, setPlotFocus] = useState('');
  const [summaryChapter, setSummaryChapter] = useState('all');

  const callAi = useCallback(async (key: AiKey, endpoint: string, body: Record<string, unknown> = {}) => {
    if (!project) return;
    setResults(prev => ({ ...prev, [key]: { ...prev[key], loading: true, error: null, data: null } }));

    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error en la solicitud');

      setResults(prev => ({ ...prev, [key]: { ...prev[key], loading: false, data: json.data } }));
    } catch (err) {
      setResults(prev => ({ ...prev, [key]: { ...prev[key], loading: false, error: err instanceof Error ? err.message : 'Error desconocido' } }));
    }
  }, [project]);

  const handleSuggestPlot = useCallback(() => {
    if (!project) return;
    callAi('plot', `/api/ai/${project.metadata.projectId}/suggest-plot`, { focus: plotFocus });
  }, [project, plotFocus, callAi]);

  const handleGenerateNames = useCallback(() => {
    if (!project) return;
    callAi('names', `/api/ai/${project.metadata.projectId}/generate-names`, { count: namesCount, style: namesStyle });
  }, [project, namesCount, namesStyle, callAi]);

  const handlePlotHoles = useCallback(() => {
    if (!project) return;
    callAi('holes', `/api/ai/${project.metadata.projectId}/plot-holes`);
  }, [project, callAi]);

  const handleSummarize = useCallback(() => {
    if (!project) return;
    callAi('summary', `/api/ai/${project.metadata.projectId}/summarize`, { chapterId: summaryChapter === 'all' ? undefined : summaryChapter });
  }, [project, summaryChapter, callAi]);

  if (!project) return null;

  const chapters = project.chapterManager.chapters;

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 shrink-0">
        <span className="text-xs font-medium text-slate-400">{t('aiPanel.title')}</span>
        <span className="text-[10px] text-slate-600">{t('aiPanel.useWithCare')}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-[10px] text-slate-500 bg-slate-800/30 border border-slate-700/20 rounded-lg px-3 py-2">
          {t('aiPanel.configHintFull')}
        </div>

        {/* Suggest Plot */}
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700/20 flex items-center gap-2">
            <span className="text-sm">💡</span>
            <span className="text-xs font-medium text-slate-300">{t('aiPanel.suggestPlot')}</span>
          </div>
          <div className="p-3 space-y-2">
            <input
              type="text"
              value={plotFocus}
              onChange={e => setPlotFocus(e.target.value)}
              placeholder={t('aiPanel.focusPlaceholder')}
              className="w-full bg-slate-700/30 border border-slate-600/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent/50"
            />
            <button onClick={handleSuggestPlot} disabled={results.plot.loading} className="w-full text-xs py-1.5 rounded-lg bg-accent hover:bg-accent-strong disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors font-medium">
              {results.plot.loading ? t('aiPanel.thinking') : t('aiPanel.suggestTwists')}
            </button>
            {results.plot.data && (
              <div className="text-xs text-slate-300 bg-slate-900/50 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {results.plot.data as string}
              </div>
            )}
            {results.plot.error && <div className="text-xs text-red-400">{results.plot.error}</div>}
          </div>
        </div>

        {/* Generate Names */}
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700/20 flex items-center gap-2">
            <span className="text-sm">🏷️</span>
            <span className="text-xs font-medium text-slate-300">{t('aiPanel.generateNames')}</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={namesCount}
                onChange={e => setNamesCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                min={1}
                max={20}
                className="w-16 bg-slate-700/30 border border-slate-600/30 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent/50 text-center"
              />
              <input
                type="text"
                value={namesStyle}
                onChange={e => setNamesStyle(e.target.value)}
                placeholder={t('aiPanel.stylePlaceholder')}
                className="flex-1 bg-slate-700/30 border border-slate-600/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent/50"
              />
            </div>
            <button onClick={handleGenerateNames} disabled={results.names.loading} className="w-full text-xs py-1.5 rounded-lg bg-accent hover:bg-accent-strong disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors font-medium">
              {results.names.loading ? t('aiPanel.generating') : t('aiPanel.generateNamesBtn', { count: namesCount })}
            </button>
            {results.names.data && Array.isArray(results.names.data) && (
              <div className="flex flex-wrap gap-1.5">
                {(results.names.data as string[]).map((name, i) => (
                  <span key={i} className="text-xs bg-violet-900/30 border border-violet-700/30 text-violet-200 px-2 py-0.5 rounded-full">
                    {name}
                  </span>
                ))}
              </div>
            )}
            {results.names.error && <div className="text-xs text-red-400">{results.names.error}</div>}
          </div>
        </div>

        {/* Plot Holes */}
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700/20 flex items-center gap-2">
            <span className="text-sm">🔍</span>
            <span className="text-xs font-medium text-slate-300">{t('aiPanel.plotHoles')}</span>
          </div>
          <div className="p-3 space-y-2">
            <button onClick={handlePlotHoles} disabled={results.holes.loading} className="w-full text-xs py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors font-medium">
              {results.holes.loading ? t('aiPanel.analyzing') : t('aiPanel.detectPlotHoles')}
            </button>
            {results.holes.data && (
              <div className="text-xs text-slate-300 bg-slate-900/50 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {results.holes.data as string}
              </div>
            )}
            {results.holes.error && <div className="text-xs text-red-400">{results.holes.error}</div>}
          </div>
        </div>

        {/* Summarize */}
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700/20 flex items-center gap-2">
            <span className="text-sm">📝</span>
            <span className="text-xs font-medium text-slate-300">{t('aiPanel.summarize')}</span>
          </div>
          <div className="p-3 space-y-2">
            <select
              value={summaryChapter}
              onChange={e => setSummaryChapter(e.target.value)}
              className="w-full bg-slate-700/30 border border-slate-600/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent/50"
            >
              <option value="all">{t('aiPanel.allProject')}</option>
              {chapters.map(ch => (
                <option key={ch.chapterId} value={ch.chapterId}>{ch.chapterId}</option>
              ))}
            </select>
            <button onClick={handleSummarize} disabled={results.summary.loading} className="w-full text-xs py-1.5 rounded-lg bg-accent hover:bg-accent-strong disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors font-medium">
              {results.summary.loading ? t('aiPanel.summarizing') : t('aiPanel.generateSummary')}
            </button>
            {results.summary.data && (
              <div className="text-xs text-slate-300 bg-slate-900/50 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {results.summary.data as string}
              </div>
            )}
            {results.summary.error && <div className="text-xs text-red-400">{results.summary.error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
