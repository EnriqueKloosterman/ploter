import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../context/useProject';
import { apiFetch } from '../../lib/api';
import PrintableCardsModal from './PrintableCardsModal';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportFormat {
  key: string;
  label: string;
  icon: string;
  desc: string;
  ext: string;
  color: string;
}

const FORMATS: ExportFormat[] = [
  { key: 'html', label: 'HTML', icon: '🌐', desc: 'Documento web autocontenido con CSS oscura', ext: '.html', color: 'bg-emerald-600 hover:bg-emerald-500' },
  { key: 'pdf', label: 'PDF', icon: '📕', desc: 'Documento PDF con tipografia profesional', ext: '.pdf', color: 'bg-red-600 hover:bg-red-500' },
  { key: 'docx', label: 'DOCX', icon: '📘', desc: 'Documento de Word compatible con Office', ext: '.docx', color: 'bg-blue-600 hover:bg-blue-500' },
  { key: 'epub', label: 'EPUB', icon: '📖', desc: 'Libro electronico (eReader, tablet, movil)', ext: '.epub', color: 'bg-violet-600 hover:bg-violet-500' },
  { key: 'fountain', label: 'Fountain', icon: '🎬', desc: 'Formato de guion cinematografico', ext: '.fountain', color: 'bg-amber-600 hover:bg-amber-500' },
];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { project } = useProject();
  const [exporting, setExporting] = useState<string | null>(null);
  const [showPrintCards, setShowPrintCards] = useState(false);

  const handleExport = useCallback(async (fmt: ExportFormat) => {
    if (!project) return;
    setExporting(fmt.key);
    try {
      const res = await apiFetch(`/api/export/${project.metadata.projectId}/${fmt.key}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.metadata.title.replace(/\s+/g, '_')}_manuscrito${fmt.ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error exporting ${fmt.key}:`, err);
    } finally {
      setExporting(null);
    }
  }, [project]);

  if (!isOpen) return null;

  const hasContent = project && project.chapterManager.chapters.some(ch => ch.manuscriptContent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-[420px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700/40">
          <h2 className="text-sm font-semibold text-slate-100">{t('exportModal.title')}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs">
            ESC
          </button>
        </div>

        <div className="p-4 space-y-2">
          {!hasContent && (
            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2 mb-3">
              {t('exportModal.noContentWarning')}
            </div>
          )}

          {FORMATS.map(fmt => (
            <button
              key={fmt.key}
              onClick={() => handleExport(fmt)}
              disabled={exporting !== null}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${exporting === fmt.key ? 'opacity-70 animate-pulse ' + fmt.color : exporting ? 'opacity-40 cursor-not-allowed' : 'bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700/30 hover:border-slate-600/50'}`}
            >
              <span className="text-xl shrink-0">{fmt.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">{fmt.label}</span>
                  {exporting === fmt.key && <span className="text-[10px] text-slate-400">{t('exportModal.exporting')}</span>}
                </div>
                <span className="text-[11px] text-slate-500 block truncate">{fmt.desc}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium shrink-0 ${fmt.color}`}>
                {fmt.ext}
              </span>
            </button>
          ))}
        </div>

        <div className="px-4 pt-2">
          <div className="border-t border-slate-700/30" />
        </div>

        <div className="px-4 pb-1">
          <button
            onClick={() => setShowPrintCards(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700/30 hover:border-slate-600/50"
          >
            <span className="text-xl shrink-0">🖨️</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-200">{t('exportModal.printCards')}</span>
              <span className="text-[11px] text-slate-500 block truncate">{t('exportModal.printCardsDesc')}</span>
            </div>
          </button>
        </div>

        <div className="px-4 pb-3 text-[10px] text-slate-600 text-center">
          {t('exportModal.includesAll')}
        </div>

        <PrintableCardsModal isOpen={showPrintCards} onClose={() => setShowPrintCards(false)} />
      </div>
    </div>
  );
};

export default ExportModal;
