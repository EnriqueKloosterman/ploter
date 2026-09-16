import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  title,
  initialValue = '',
  placeholder = '',
  confirmLabel,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = React.useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onConfirm(value.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <form onSubmit={handleSubmit} className="p-5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors border border-slate-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-accent hover:bg-accent-strong text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {confirmLabel ?? t('common.accept')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InputModal;
