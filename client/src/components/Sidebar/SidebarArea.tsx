import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterPanel from './CharacterPanel';
import ChapterPanel from './ChapterPanel';
import { useProject } from '../../context/ProjectContext';
import { exportProjectToMarkdown } from '../ui/exportMarkdown';

const SidebarArea: React.FC = () => {
  const { project } = useProject();
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleManualSave = async () => {
    try {
      setIsSaving(true);
      await fetch(`http://localhost:5000/api/projects/${project.metadata?.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      setTimeout(() => setIsSaving(false), 800);
    } catch (e) {
      alert('Error al guardar el Proyecto');
      setIsSaving(false);
    }
  };

  return (
    <div className="w-80 h-full bg-[#1e293b] border-r border-slate-800 flex flex-col shadow-2xl relative z-20">
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors py-1 px-2 rounded hover:bg-slate-800 -ml-2"
        >
          <span>←</span> Librería
        </button>
        <span className="text-xs font-mono text-slate-500 truncate max-w-[120px]">{project.metadata?.title}</span>
      </div>
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">Recursos Globales</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportProjectToMarkdown(project)}
            className="text-slate-400 hover:text-blue-400 transition-colors bg-slate-800/50 hover:bg-slate-700/80 p-1.5 rounded-lg border border-slate-700/50 hover:border-blue-500/50"
            title="Exportar a Markdown"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="text-slate-400 hover:text-emerald-400 disabled:text-emerald-500 disabled:opacity-50 transition-colors bg-slate-800/50 hover:bg-slate-700/80 p-1.5 rounded-lg border border-slate-700/50 hover:border-emerald-500/50"
            title="Guardar Proyecto Manualmente"
          >
            {isSaving ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <CharacterPanel />
        <ChapterPanel />
      </div>
    </div>
  );
};

export default SidebarArea;
