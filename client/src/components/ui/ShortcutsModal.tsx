import React from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Guía y Atajos de Teclado</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            
            {/* Shortcut Item */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Seleccionar varias tarjetas a la vez</span>
              <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-emerald-400 shadow-sm">
                Shift + Arrastrar Mouse
              </kbd>
            </div>

            {/* Shortcut Item */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Eliminar tarjetas seleccionadas</span>
              <kbd className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-red-400 shadow-sm">
                Retroceso (Del)
              </kbd>
            </div>

            {/* Shortcut Item */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Unir dos tarjetas con un "Cable"</span>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
                Arrastrar círculo lateral a otra carta
              </span>
            </div>

            {/* Shortcut Item */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Paneo y Navegación</span>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
                Lazo Izquierdo en el fondo
              </span>
            </div>

             {/* Shortcut Item */}
             <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <span className="text-sm font-medium text-slate-300">Saltar o Buscar Capítulo</span>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
                Pulsar icono "👁️" en menú izquierdo
              </span>
            </div>

          </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 italic">Puedes volver a ver este menú en cualquier momento haciendo clic en el botón superior de "?"</p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
