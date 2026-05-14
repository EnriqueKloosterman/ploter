import React, { createContext, useContext } from 'react';
import type { IBeat, ICharacter, ICharacterRelation, IChapter, IEdge, INode, IProject } from './projectTypes';

export interface ProjectDataContextType {
  project: IProject;
  setProject: React.Dispatch<React.SetStateAction<IProject | null>>;
  activeFocusChapterId: string | null;
  setActiveFocusChapterId: React.Dispatch<React.SetStateAction<string | null>>;
  activeFilterCharId: string | null;
  setActiveFilterCharId: React.Dispatch<React.SetStateAction<string | null>>;
  updateNodes: (nodes: INode[]) => void;
  updateEdges: (edges: IEdge[]) => void;
  addCharacter: (char: ICharacter) => void;
  addChapter: (chap: IChapter) => void;
  updateCharacter: (charId: string, updates: Partial<ICharacter>) => void;
  updateChapter: (oldChapterId: string, newChapterId: string) => void;
  removeCharacter: (charId: string) => void;
  addRelation: (relation: ICharacterRelation) => void;
  updateRelation: (relationId: string, updates: Partial<ICharacterRelation>) => void;
  removeRelation: (relationId: string) => void;
  removeChapter: (chapterId: string) => void;
  addBeat: (chapterId: string, beat: IBeat) => void;
  updateBeat: (chapterId: string, beatId: string, updates: Partial<IBeat>) => void;
  removeBeat: (chapterId: string, beatId: string) => void;
  reorderChapters: (chapters: IChapter[]) => void;
  updateChapterManuscript: (chapterId: string, manuscriptContent: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface ProjectStatusContextType {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  saveProject: () => Promise<boolean>;
}

export const ProjectDataContext = createContext<ProjectDataContextType | undefined>(undefined);
export const ProjectStatusContext = createContext<ProjectStatusContextType | undefined>(undefined);

export const useProjectData = (): ProjectDataContextType => {
  const context = useContext(ProjectDataContext);
  if (!context) {
    throw new Error('useProjectData must be used within a ProjectProvider');
  }
  return context;
};

export const useProjectStatus = (): ProjectStatusContextType => {
  const context = useContext(ProjectStatusContext);
  if (!context) {
    throw new Error('useProjectStatus must be used within a ProjectProvider');
  }
  return context;
};

export const useProject = (): ProjectDataContextType & ProjectStatusContextType => {
  const data = useProjectData();
  const status = useProjectStatus();
  return { ...data, ...status };
};
