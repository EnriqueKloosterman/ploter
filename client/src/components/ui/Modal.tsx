import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
  hideHeader?: boolean;
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  hideHeader = false,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full ${sizeClass[size]} flex flex-col overflow-hidden animate-fade-zoom-in`}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-700/50 shrink-0">
            <h2 className="text-base font-bold text-slate-100 truncate">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="shrink-0 text-slate-500 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto custom-scrollbar">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-700/50 shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
