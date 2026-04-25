import React, { createContext, useContext } from 'react';
import type { ICharacter, IChapter, IEdge, INode, IProject } from './projectTypes';

export interface ProjectContextType {
  project: IProject;
  setProject: React.Dispatch<React.SetStateAction<IProject | null>>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  saveProject: () => Promise<boolean>;
  activeFocusChapterId: string | null;
  setActiveFocusChapterId: React.Dispatch<React.SetStateAction<string | null>>;
  activeFilterCharId: string | null;
  setActiveFilterCharId: React.Dispatch<React.SetStateAction<string | null>>;
  updateNodes: (nodes: INode[]) => void;
  updateEdges: (edges: IEdge[]) => void;
  addCharacter: (char: ICharacter) => void;
  addChapter: (chap: IChapter) => void;
  updateCharacter: (charId: string, newName: string) => void;
  updateChapter: (oldChapterId: string, newChapterId: string) => void;
  removeCharacter: (charId: string) => void;
  removeChapter: (chapterId: string) => void;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
