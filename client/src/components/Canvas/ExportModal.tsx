import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Clapperboard,
  FileText,
  FileType,
  Gamepad2,
  Globe,
  Printer,
  type LucideIcon,
} from 'lucide-react';
import { useProject } from '../../context/useProject';
import { apiFetch } from '../../lib/api';
import Modal from '../ui/Modal';
import PrintableCardsModal from './PrintableCardsModal';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportFormat {
  key: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  ext: string;
  color: string;
  suffix: string;
}

const FORMATS: ExportFormat[] = [
  { key: 'html', label: 'HTML', icon: Globe, desc: 'Documento web autocontenido con CSS oscura', ext: '.html', color: 'bg-emerald-600 hover:bg-emerald-500', suffix: 'manuscrito' },
  { key: 'pdf', label: 'PDF', icon: FileText, desc: 'Documento PDF con tipografia profesional', ext: '.pdf', color: 'bg-red-600 hover:bg-red-500', suffix: 'manuscrito' },
  { key: 'docx', label: 'DOCX', icon: FileType, desc: 'Documento de Word compatible con Office', ext: '.docx', color: 'bg-blue-600 hover:bg-blue-500', suffix: 'manuscrito' },
  { key: 'epub', label: 'EPUB', icon: BookOpen, desc: 'Libro electronico (eReader, tablet, movil)', ext: '.epub', color: 'bg-violet-600 hover:bg-violet-500', suffix: 'manuscrito' },
  { key: 'fountain', label: 'Fountain', icon: Clapperboard, desc: 'Formato de guion cinematografico', ext: '.fountain', color: 'bg-amber-600 hover:bg-amber-500', suffix: 'manuscrito' },
  { key: 'html-playable', label: 'HTML Jugable', icon: Gamepad2, desc: 'Historia interactiva Ink autocontenida (Ink Studio)', ext: '.html', color: 'bg-teal-600 hover:bg-teal-500', suffix: 'historia_interactiva' },
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
      a.download = `${project.metadata.title.replace(/\s+/g, '_')}_${fmt.suffix}${fmt.ext}`;
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
    <Modal isOpen={isOpen} onClose={onClose} title={t('exportModal.title')}>
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
            <fmt.icon size={20} className="shrink-0" />
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

      <div className="px-4 pt-1">
        <div className="border-t border-slate-700/30" />
      </div>

      <div className="px-4 py-3">
        <button
          onClick={() => setShowPrintCards(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700/30 hover:border-slate-600/50"
        >
          <Printer size={20} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-slate-200">{t('exportModal.printCards')}</span>
            <span className="text-[11px] text-slate-500 block truncate">{t('exportModal.printCardsDesc')}</span>
          </div>
        </button>
      </div>

      <PrintableCardsModal isOpen={showPrintCards} onClose={() => setShowPrintCards(false)} />
    </Modal>
  );
};

export default ExportModal;
