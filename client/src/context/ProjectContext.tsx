import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// === TypeScript Interfaces reflecting data.json ===
export interface ICharacter {
  id: string;
  name: string;
  image?: { url: string; width: number; height: number };
}

export interface INodeData {
  title?: string;
  content?: string;
  color?: string;
  categoryTags?: string[];
  characterTags?: string[];
  chapterId?: string; // Vinculo hacia el Acto/Capitulo
}

export interface INode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: INodeData;
}

export interface IEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface IBeat {
  id: string;
  description: string;
  linkedNodes: string[];
}

export interface IChapter {
  chapterId: string;
  beats: IBeat[];
}

export interface IProject {
  metadata: {
    projectId: string;
    title: string;
    createdAt: string;
    lastModified: string;
  };
  characters: ICharacter[];
  canvas: {
    viewport: { x: number; y: number; zoom: number };
    nodes: INode[];
    edges: IEdge[];
  };
  chapterManager: {
    chapters: IChapter[];
  };
  trashBin: {
    nodes: INode[];
    edges: IEdge[];
  };
}

interface ProjectContextType {
  project: IProject;
  setProject: React.Dispatch<React.SetStateAction<IProject | null>>;
  activeFocusChapterId: string | null;
  setActiveFocusChapterId: React.Dispatch<React.SetStateAction<string | null>>;
  updateNodes: (nodes: INode[]) => void;
  updateEdges: (edges: IEdge[]) => void;
  addCharacter: (char: ICharacter) => void;
  addChapter: (chap: IChapter) => void;
  removeCharacter: (charId: string) => void;
  removeChapter: (chapterId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode, projectId: string }> = ({ children, projectId }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`);
        const json = await response.json();
        
        if (json.status === 'success' && json.data) {
          setProject(json.data);
        } else {
          // If project fails to load, maybe throw or handle
          console.error("No se pudo cargar el proyecto, devolvio:", json);
        }
      } catch (error) {
        console.error("Error al obtener el proyecto desde el backend:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const updateNodes = (nodes: INode[]) => {
    setProject((prev) => ({
      ...prev,
      canvas: { ...prev.canvas, nodes }
    }));
  };

  const updateEdges = (edges: IEdge[]) => {
    setProject((prev) => ({
      ...prev,
      canvas: { ...prev.canvas, edges }
    }));
  };

  const addCharacter = (char: ICharacter) => {
    setProject((prev) => ({
      ...prev,
      characters: [...prev.characters, char]
    }));
  };

  const addChapter = (chap: IChapter) => {
    setProject((prev) => ({
      ...prev,
      chapterManager: {
        ...prev.chapterManager,
        chapters: [...prev.chapterManager.chapters, chap]
      }
    }));
  };

  const removeCharacter = (charId: string) => {
    setProject((prev) => {
      // Remover también los IDs de este personaje de todas las tarjetas
      const updatedNodes = prev.canvas.nodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          characterTags: n.data.characterTags?.filter(id => id !== charId) || []
        }
      }));
      return {
        ...prev,
        characters: prev.characters.filter(c => c.id !== charId),
        canvas: { ...prev.canvas, nodes: updatedNodes }
      };
    });
  };

  const removeChapter = (chapterId: string) => {
    setProject((prev) => ({
      ...prev,
      chapterManager: {
        ...prev.chapterManager,
        chapters: prev.chapterManager.chapters.filter(c => c.chapterId !== chapterId)
      }
    }));
  };

  const [activeFocusChapterId, setActiveFocusChapterId] = useState<string | null>(null);

  return (
    <ProjectContext.Provider value={{ 
        project: project as IProject, setProject, 
        activeFocusChapterId, setActiveFocusChapterId,
        updateNodes, updateEdges, 
        addCharacter, addChapter, removeCharacter, removeChapter 
    }}>
      {isLoading || !project ? (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="ml-4 font-semibold text-lg tracking-wide">Desplegando Tapiz Narrativo...</p>
        </div>
      ) : (
        children
      )}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
