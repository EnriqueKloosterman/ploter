import mongoose, { Document } from 'mongoose';
import { IProject } from './Project.js';
export interface ISnapshot extends Document {
    projectId: mongoose.Types.ObjectId;
    description: string;
    projectData: Partial<IProject>;
    createdAt: Date;
}
declare const _default: mongoose.Model<ISnapshot, {}, {}, {}, mongoose.Document<unknown, {}, ISnapshot, {}, mongoose.DefaultSchemaOptions> & ISnapshot & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISnapshot>;
export default _default;
//# sourceMappingURL=Snapshot.d.ts.map