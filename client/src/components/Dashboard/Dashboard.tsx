import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface IProjectMeta {
  metadata: {
    projectId: string;
    title: string;
    lastModified: string;
    createdAt: string;
  }
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<IProjectMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects');
      const json = await res.json();
      if (json.status === 'success') {
        setProjects(json.data);
      }
    } catch (error) {
      console.error("Fallo al obtener proyectos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    const title = prompt("Título de tu nueva obra:");
    if (!title) return;

    try {
      setIsCreating(true);
      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const json = await res.json();
      
      if (json.status === 'success') {
        const newProjId = json.data.metadata.projectId;
        navigate(`/project/${newProjId}`);
      }
    } catch (error) {
      alert("Error al crear historia.");
      setIsCreating(false);
    }
  };

  const handleRenameProject = async (e: React.MouseEvent, projectId: string, currentTitle: string) => {
    e.stopPropagation();
    const newTitle = prompt("Nuevo título de la obra:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "metadata.title": newTitle })
      });
      if (res.ok) fetchProjects();
    } catch (err) {
      alert("No se pudo renombrar el proyecto.");
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas incinerar esta historia? Esta acción es irreversible.")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchProjects();
    } catch (err) {
      alert("No se pudo eliminar el proyecto.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0f172a] text-slate-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="ml-4 font-semibold text-lg">Cargando Librería...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-500 mb-2">
              PlotWeaver
            </h1>
            <p className="text-slate-400 font-medium">Tu librería de multiversos narrativos</p>
          </div>
          <button 
            onClick={handleCreateNew}
            disabled={isCreating}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
          >
            <span className="text-xl leading-none">+</span>
            Tejer Nueva Historia
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(proj => (
            <div 
              key={proj.metadata.projectId}
              onClick={() => navigate(`/project/${proj.metadata.projectId}`)}
              className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-xl group relative overflow-hidden flex flex-col justify-between h-48"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {proj.metadata.title}
                </h2>
                <div className="flex gap-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleRenameProject(e, proj.metadata.projectId, proj.metadata.title)}
                    className="hover:text-blue-400 transition-colors"
                    title="Renombrar"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={(e) => handleDeleteProject(e, proj.metadata.projectId)}
                    className="hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-end text-xs font-medium text-slate-500 mt-4">
                <span>Modif: {new Date(proj.metadata.lastModified).toLocaleDateString()}</span>
                <span className="bg-slate-900 px-3 py-1.5 rounded-lg text-slate-400 group-hover:bg-emerald-900/50 group-hover:text-emerald-300 transition-colors">Entrar ➔</span>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-500 text-lg mb-4">El vacío es absoluto. Aún no has escrito historias.</p>
              <button onClick={handleCreateNew} className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4">Empezar ahora</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
