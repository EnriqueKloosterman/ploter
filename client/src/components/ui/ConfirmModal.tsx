import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-slate-900 border border-slate-700/50 shadow-2xl rounded-2xl p-6 w-96 transform scale-100 transition-all"
        onClick={(e) => e.stopPropagation()} // Evitar cerrado indeseado si hubiera un click outside listener
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500/10 rounded-full mb-4 border border-red-500/20">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-bold text-center text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-center text-slate-400 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-center">
          <button 
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors border border-slate-700"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)] shadow-red-500/20"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
