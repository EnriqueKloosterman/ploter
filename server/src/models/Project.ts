import mongoose, { Schema, Document } from 'mongoose';

// Base Interfaces
export interface ICharacter {
  id: string;
  name: string;
  image?: { url: string; width: number; height: number; };
}

export interface INodeData {
  title: string;
  content: string;
  color?: string;
  characterTags?: string[];
  categoryTags?: string[];
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

export interface IProject extends Document {
  authorId: mongoose.Types.ObjectId; // Ref to User._id
  metadata: {
    projectId: string;
    title: string;
    createdAt: Date;
    lastModified: Date;
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

// Schemas
const CharacterSchema = new Schema<ICharacter>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  image: {
    url: String,
    width: Number,
    height: Number
  }
}, { _id: false });

const NodeSchema = new Schema<INode>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  data: {
    title: String,
    content: String,
    color: String,
    characterTags: [String],
    categoryTags: [String],
    chapterId: String
  }
}, { _id: false });

const EdgeSchema = new Schema<IEdge>({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: String,
  targetHandle: String,
  label: String
}, { _id: false });

const BeatSchema = new Schema<IBeat>({
  id: { type: String, required: true },
  description: String,
  linkedNodes: [String]
}, { _id: false });

const ChapterSchema = new Schema<IChapter>({
  chapterId: { type: String, required: true },
  beats: [BeatSchema]
}, { _id: false });

const ProjectSchema = new Schema<IProject>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  metadata: {
    projectId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now }
  },
  characters: [CharacterSchema],
  canvas: {
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 }
    },
    nodes: [NodeSchema],
    edges: [EdgeSchema]
  },
  chapterManager: {
    chapters: [ChapterSchema]
  },
  trashBin: {
    nodes: [NodeSchema],
    edges: [EdgeSchema]
  }
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema);
