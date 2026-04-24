import mongoose, { Schema, Document } from 'mongoose';
import { IProject } from './Project.js';

// A Snapshot securely saves a frozen state of a Project.
// Notice that the projectData is a Mixed/Nested copy of the state, we keep it as Mixed or strict subdocument.
// To keep it clean and truly decoupled, we can sore the entire project structure.
export interface ISnapshot extends Document {
  projectId: mongoose.Types.ObjectId; // Ref to Project
  description: string;
  projectData: Partial<IProject>; // A serialized dump of the project
  createdAt: Date;
}

const SnapshotSchema = new Schema<ISnapshot>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  description: { type: String, required: true },
  projectData: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);
