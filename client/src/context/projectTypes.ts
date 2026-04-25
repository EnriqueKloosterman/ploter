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
  chapterId?: string;
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
