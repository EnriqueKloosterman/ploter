import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import ConfirmModal from '../ui/ConfirmModal';

const CharacterPanel: React.FC = () => {
  const { project, addCharacter, removeCharacter } = useProject();
  const { characters } = project;
  
  const [isAdding, setIsAdding] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    
    addCharacter({
      id: `char_${Date.now()}`,
      name: newCharName.trim()
    });
    setNewCharName('');
    setIsAdding(false);
  };

  const confirmDeletion = () => {
    if (deleteId) {
      removeCharacter(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg mb-6 max-h-64 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-widest">Personajes</h3>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{characters.length}</span>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-600 rounded-md w-6 h-6 flex items-center justify-center font-bold"
        >
          {isAdding ? '−' : '+'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="p-3 border-b border-slate-700/50 bg-slate-850 flex gap-2">
          <input 
            type="text" 
            value={newCharName}
            onChange={(e) => setNewCharName(e.target.value)}
            placeholder="Nombre..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
            Ok
          </button>
        </form>
      )}
      
      <div className="p-3 overflow-y-auto space-y-2 grow relative group">
        {characters.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-4">Aún no hay personajes.</p>
        ) : (
          characters.map((char) => (
            <div key={char.id} className="group/item flex items-center gap-3 p-2 bg-slate-800 rounded-lg hover:bg-slate-750 border border-transparent hover:border-slate-600 transition-colors relative">
              <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0 overflow-hidden border-2 border-slate-600">
                {char.image?.url ? (
                  <img src={char.image.url} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                    {char.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-medium text-slate-200 truncate">{char.name}</p>
                <p className="text-xs text-slate-500 truncate">ID: {char.id}</p>
              </div>
              
              <button 
                onClick={() => setDeleteId(char.id)}
                className="absolute right-2 text-slate-500 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700 p-1 rounded-sm"
                title="Borrar Personaje"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Eliminar Personaje"
        message="¿Estás seguro que deseas purgar este personaje? Esta acción lo borrará de todas las Nodos donde estaba vinculado."
        onConfirm={confirmDeletion}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default CharacterPanel;
