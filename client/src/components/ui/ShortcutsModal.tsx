import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import Modal from './Modal';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={<p className="text-xs text-slate-500 italic text-center">{t('shortcuts.tip')}</p>}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
            <HelpCircle className="w-5 h-5 text-accent" />
          </div>
          {t('shortcuts.title')}
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.saveProject')}</span>
            <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-emerald-400 shadow-sm">
              Ctrl + S
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.newCard')}</span>
            <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-emerald-400 shadow-sm">
              N
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.newChapter')}</span>
            <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-purple-400 shadow-sm">
              C
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.undo')}</span>
            <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-amber-400 shadow-sm">
              Ctrl + Z
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.redo')}</span>
            <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-amber-400 shadow-sm">
              Ctrl + Shift + Z
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.closeModal')}</span>
            <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-slate-400 shadow-sm">
              Escape
            </kbd>
          </div>

          <hr className="border-slate-700/50 my-2" />

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.selectMultiple')}</span>
            <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-emerald-400 shadow-sm">
              Shift + Arrastrar Mouse
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.deleteSelected')}</span>
            <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-red-400 shadow-sm">
              Retroceso (Del)
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.joinCards')}</span>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
              Arrastrar círculo lateral a otra carta
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.panNavigate')}</span>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
              Lazo Izquierdo en el fondo
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-sm font-medium text-slate-300">{t('shortcuts.jumpChapter')}</span>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
              Pulsar icono "👁️" en menú izquierdo
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShortcutsModal;
