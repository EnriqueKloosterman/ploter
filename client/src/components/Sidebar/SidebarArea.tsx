import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CharacterPanel from './CharacterPanel';
import ChapterPanel from './ChapterPanel';
import ProjectStats from '../ui/ProjectStats';
import TagsModal from '../ui/TagsModal';
import SnapshotsModal from '../ui/SnapshotsModal';
import LanguageSelector from '../ui/LanguageSelector';
import { useProject } from '../../context/useProject';
import { useToast } from '../../context/ToastContext';
import { exportProjectToMarkdown } from '../ui/exportMarkdown';
import { apiFetch } from '../../lib/api';

const SidebarArea: React.FC = () => {
  const { t } = useTranslation();
  const { project, isSaving, hasUnsavedChanges, saveError, saveProject, setProject } = useProject();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTagsOpen, setTagsOpen] = useState(false);
  const [isSnapshotsOpen, setSnapshotsOpen] = useState(false);

  const handleManualSave = async () => {
    const didSave = await saveProject();
    if (didSave) {
      showToast('Proyecto guardado', 'success');
    } else {
      showToast('Error al guardar el proyecto', 'error');
    }
  };

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <div className="relative z-20 h-full flex">
      <div className={`${isCollapsed ? 'w-0 overflow-hidden' : 'w-80'} h-full bg-[#1e293b] border-r border-slate-800 flex flex-col shadow-2xl transition-all duration-200`}>
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/')}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors py-1 px-2 rounded hover:bg-slate-800 -ml-2"
            >
              <span>{'<'}</span> {t('dashboard.title')}
            </button>
            <LanguageSelector />
          </div>
          <span className="text-xs font-mono text-slate-500 truncate max-w-[120px]">{project.metadata?.title}</span>
        </div>
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">Recursos Globales</h2>
            {saveError && (
              <p className="text-xs text-red-400 mt-1">{saveError}</p>
            )}
            {!saveError && hasUnsavedChanges && !isSaving && (
              <p className="text-xs text-amber-300 mt-1">Hay cambios sin guardar</p>
            )}
          </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSnapshotsOpen(true)}
            className="text-slate-400 hover:text-amber-400 transition-colors bg-slate-800/50 hover:bg-slate-700/80 p-1.5 rounded-lg border border-slate-700/50 hover:border-amber-500/50"
            title="Snapshots"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={() => setTagsOpen(true)}
            className="text-slate-400 hover:text-blue-400 transition-colors bg-slate-800/50 hover:bg-slate-700/80 p-1.5 rounded-lg border border-slate-700/50 hover:border-blue-500/50"
            title="Gestionar tags"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </button>
          <button
            onClick={() => {
              exportProjectToMarkdown(project);
              showToast('Proyecto exportado a Markdown', 'success');
            }}
            className="text-slate-400 hover:text-blue-400 transition-colors bg-slate-800/50 hover:bg-slate-700/80 p-1.5 rounded-lg border border-slate-700/50 hover:border-blue-500/50"
            title="Exportar a Markdown"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
          <button
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="text-slate-400 hover:text-emerald-400 disabled:text-slate-600 disabled:opacity-40 transition-colors bg-slate-800/50 hover:bg-slate-700/80 disabled:bg-slate-800/30 p-1.5 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 disabled:border-slate-700/30"
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
        <ProjectStats />
        <CharacterPanel />
        <ChapterPanel />
      </div>

      <TagsModal isOpen={isTagsOpen} onClose={() => setTagsOpen(false)} />
      <SnapshotsModal
        isOpen={isSnapshotsOpen}
        onClose={() => setSnapshotsOpen(false)}
        projectId={project.metadata.projectId}
        onRestore={async () => {
          const res = await apiFetch(`/api/projects/${project.metadata.projectId}`);
          const json = await res.json();
          if (json.status === 'success' && json.data) setProject(json.data);
        }}
      />
      </div>

      <button
        onClick={toggleCollapse}
        className="absolute top-4 w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-r-lg border border-slate-700/50 border-l-0 flex items-center justify-center transition-colors shadow-lg z-30"
        style={{ left: isCollapsed ? '0px' : '320px' }}
        title={isCollapsed ? 'Abrir panel' : 'Cerrar panel'}
      >
        {isCollapsed ? '▶' : '◀'}
      </button>
    </div>
  );
};

export default SidebarArea;
