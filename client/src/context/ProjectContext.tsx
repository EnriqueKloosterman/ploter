import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { ProjectContext } from './useProject';
import type { ICharacter, IChapter, IEdge, INode, IProject } from './projectTypes';

const AUTOSAVE_DELAY_MS = 5000;

const snapshotProject = (project: IProject | null) => (
  project ? JSON.stringify(project) : null
);

export const ProjectProvider: React.FC<{ children: ReactNode; projectId: string }> = ({ children, projectId }) => {
  const [project, setProject] = useState<IProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeFocusChapterId, setActiveFocusChapterId] = useState<string | null>(null);
  const [activeFilterCharId, setActiveFilterCharId] = useState<string | null>(null);

  const projectRef = useRef<IProject | null>(null);
  const isSavingRef = useRef(false);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);

  const clearAutosaveTimeout = useCallback(() => {
    if (autosaveTimeoutRef.current !== null) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const saveProject = useCallback(async () => {
    const currentProject = projectRef.current;
    const currentSnapshot = snapshotProject(currentProject);

    if (!currentProject?.metadata?.projectId || !currentSnapshot || isSavingRef.current) {
      return false;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await apiFetch(`/api/projects/${currentProject.metadata.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProject)
      });

      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status}`);
      }

      lastSavedSnapshotRef.current = currentSnapshot;
      setHasUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error('Error al guardar el proyecto:', error);
      setSaveError('No se pudo guardar el proyecto.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      clearAutosaveTimeout();

      try {
        setIsLoading(true);
        setLoadError(null);
        setSaveError(null);
        const response = await apiFetch(`/api/projects/${projectId}`);
        const json = await response.json();

        if (response.ok && json.status === 'success' && json.data) {
          const loadedProject = json.data as IProject;
          setProject(loadedProject);
          lastSavedSnapshotRef.current = snapshotProject(loadedProject);
          setHasUnsavedChanges(false);
        } else {
          setProject(null);
          lastSavedSnapshotRef.current = null;
          setHasUnsavedChanges(false);
          setLoadError(json.message || 'No se pudo cargar el proyecto.');
          console.error('No se pudo cargar el proyecto, devolvio:', json);
        }
      } catch (error) {
        setProject(null);
        lastSavedSnapshotRef.current = null;
        setHasUnsavedChanges(false);
        setLoadError('Error de red al cargar el proyecto.');
        console.error('Error al obtener el proyecto desde el backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [clearAutosaveTimeout, projectId]);

  useEffect(() => {
    if (!project) {
      clearAutosaveTimeout();
      setHasUnsavedChanges(false);
      return;
    }

    const currentSnapshot = snapshotProject(project);
    if (!currentSnapshot || lastSavedSnapshotRef.current === null) {
      setHasUnsavedChanges(false);
      return;
    }

    const isDirty = currentSnapshot !== lastSavedSnapshotRef.current;
    setHasUnsavedChanges(isDirty);

    clearAutosaveTimeout();
    if (!isDirty) {
      return;
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      void saveProject();
    }, AUTOSAVE_DELAY_MS);
  }, [clearAutosaveTimeout, project, saveProject]);

  useEffect(() => () => {
    clearAutosaveTimeout();
  }, [clearAutosaveTimeout]);

  const updateNodes = (nodes: INode[]) => {
    setProject((prev) => prev ? ({
      ...prev,
      canvas: { ...prev.canvas, nodes }
    }) : prev);
  };

  const updateEdges = (edges: IEdge[]) => {
    setProject((prev) => prev ? ({
      ...prev,
      canvas: { ...prev.canvas, edges }
    }) : prev);
  };

  const addCharacter = (char: ICharacter) => {
    setProject((prev) => prev ? ({
      ...prev,
      characters: [...prev.characters, char]
    }) : prev);
  };

  const addChapter = (chap: IChapter) => {
    setProject((prev) => prev ? ({
      ...prev,
      chapterManager: {
        ...prev.chapterManager,
        chapters: [...prev.chapterManager.chapters, chap]
      }
    }) : prev);
  };

  const updateCharacter = (charId: string, newName: string) => {
    setProject((prev) => prev ? ({
      ...prev,
      characters: prev.characters.map((char) => char.id === charId ? { ...char, name: newName } : char)
    }) : prev);
  };

  const updateChapter = (oldChapterId: string, newChapterId: string) => {
    setProject((prev) => {
      if (!prev) return prev;

      const updatedNodes = prev.canvas.nodes.map((node) => {
        if (node.data.chapterId === oldChapterId) {
          return { ...node, data: { ...node.data, chapterId: newChapterId } };
        }
        return node;
      });

      const updatedChapters = prev.chapterManager.chapters.map((chapter) => {
        if (chapter.chapterId === oldChapterId) {
          return { ...chapter, chapterId: newChapterId };
        }
        return chapter;
      });

      return {
        ...prev,
        canvas: { ...prev.canvas, nodes: updatedNodes },
        chapterManager: { ...prev.chapterManager, chapters: updatedChapters }
      };
    });
  };

  const removeCharacter = (charId: string) => {
    setProject((prev) => {
      if (!prev) return prev;

      const updatedNodes = prev.canvas.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          characterTags: node.data.characterTags?.filter((id) => id !== charId) || []
        }
      }));

      return {
        ...prev,
        characters: prev.characters.filter((char) => char.id !== charId),
        canvas: { ...prev.canvas, nodes: updatedNodes }
      };
    });
  };

  const removeChapter = (chapterId: string) => {
    setProject((prev) => {
      if (!prev) return prev;

      const updatedNodes = prev.canvas.nodes.map((node) => (
        node.data.chapterId === chapterId
          ? { ...node, data: { ...node.data, chapterId: '' } }
          : node
      ));

      return {
        ...prev,
        canvas: { ...prev.canvas, nodes: updatedNodes },
        chapterManager: {
          ...prev.chapterManager,
          chapters: prev.chapterManager.chapters.filter((chapter) => chapter.chapterId !== chapterId)
        }
      };
    });

    setActiveFocusChapterId((prev) => (prev === chapterId ? null : prev));
  };

  return (
    <ProjectContext.Provider
      value={{
        project: project as IProject,
        setProject,
        isSaving,
        hasUnsavedChanges,
        saveError,
        saveProject,
        activeFocusChapterId,
        setActiveFocusChapterId,
        activeFilterCharId,
        setActiveFilterCharId,
        updateNodes,
        updateEdges,
        addCharacter,
        addChapter,
        updateCharacter,
        updateChapter,
        removeCharacter,
        removeChapter
      }}
    >
      {isLoading ? (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="ml-4 font-semibold text-lg tracking-wide">Cargando proyecto...</p>
        </div>
      ) : loadError || !project ? (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-300 px-6">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold text-white mb-3">Proyecto no disponible</h2>
            <p className="text-slate-400">{loadError || 'No se encontro el proyecto solicitado.'}</p>
          </div>
        </div>
      ) : (
        children
      )}
    </ProjectContext.Provider>
  );
};
