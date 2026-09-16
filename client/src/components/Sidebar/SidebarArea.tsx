import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, LoaderCircle, Plus, Save, Tag } from 'lucide-react';
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
      <div className={`${isCollapsed ? 'w-0 overflow-hidden' : 'w-80'} h-full bg-surface-raised border-r border-slate-800 flex flex-col shadow-2xl transition-all duration-200`}>
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
            aria-label="Snapshots"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTagsOpen(true)}
            className="text-slate-400 hover:text-accent transition-colors bg-slate-800/50 hover:bg-slate-700/80 p-1.5 rounded-lg border border-slate-700/50 hover:border-accent/50"
            title="Gestionar tags"
            aria-label="Gestionar tags"
          >
            <Tag className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              exportProjectToMarkdown(project);
              showToast('Proyecto exportado a Markdown', 'success');
            }}
            className="text-slate-400 hover:text-accent transition-colors bg-slate-800/50 hover:bg-slate-700/80 p-1.5 rounded-lg border border-slate-700/50 hover:border-accent/50"
            title="Exportar a Markdown"
            aria-label="Exportar a Markdown"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="text-slate-400 hover:text-emerald-400 disabled:text-slate-600 disabled:opacity-40 transition-colors bg-slate-800/50 hover:bg-slate-700/80 disabled:bg-slate-800/30 p-1.5 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 disabled:border-slate-700/30"
            title="Guardar Proyecto Manualmente"
            aria-label="Guardar Proyecto Manualmente"
          >
            {isSaving ? (
              <LoaderCircle className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
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
