import mongoose, { Document } from 'mongoose';
export interface ICharacter {
    id: string;
    name: string;
    image?: {
        url: string;
        width: number;
        height: number;
    };
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
    position: {
        x: number;
        y: number;
    };
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
    authorId: mongoose.Types.ObjectId;
    metadata: {
        projectId: string;
        title: string;
        createdAt: Date;
        lastModified: Date;
    };
    characters: ICharacter[];
    canvas: {
        viewport: {
            x: number;
            y: number;
            zoom: number;
        };
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
declare const _default: mongoose.Model<IProject, {}, {}, {}, mongoose.Document<unknown, {}, IProject, {}, mongoose.DefaultSchemaOptions> & IProject & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IProject>;
export default _default;
//# sourceMappingURL=Project.d.ts.map