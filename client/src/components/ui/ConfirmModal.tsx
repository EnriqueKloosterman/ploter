import React from 'react';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onCancel} hideHeader size="sm">
      <div className="p-6 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500/10 rounded-full mb-4 border border-red-500/20">
          <TriangleAlert className="w-6 h-6 text-red-500" />
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors border border-slate-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-red-500/20"
          >
            {t('common.yes')}, {t('common.delete')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
