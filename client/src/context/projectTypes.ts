export interface ICharacter {
  id: string;
  name: string;
  image?: { url: string; width: number; height: number };
  biography?: string;
  appearance?: string;
  psychology?: string;
  backstory?: string;
}

export interface ICharacterRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'familia' | 'romance' | 'enemistad' | 'aliado' | 'mentor';
  label?: string;
  description?: string;
}

export interface INodeData {
  title?: string;
  content?: string;
  sceneAction?: string;
  color?: string;
  categoryTags?: string[];
  characterTags?: string[];
  chapterId?: string;
  [key: string]: unknown;
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
  type?: 'normal' | 'causa' | 'conflicto';
}

export interface IBeat {
  id: string;
  description: string;
  linkedNodes: string[];
}

export interface IChapter {
  chapterId: string;
  beats: IBeat[];
  manuscriptContent?: string;
}

export interface IProjectData {
  metadata: {
    projectId: string;
    title: string;
    createdAt: string;
    lastModified: string;
  };
  characters: ICharacter[];
  characterRelations: ICharacterRelation[];
  canvas: {
    viewport: { x: number; y: number; zoom: number };
    nodes: INode[];
    edges: IEdge[];
  };
  chapterManager: {
    chapters: IChapter[];
  };
}

export type IProject = IProjectData;
