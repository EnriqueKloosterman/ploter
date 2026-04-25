import mongoose, { Schema } from 'mongoose';
const SnapshotSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    description: { type: String, required: true },
    projectData: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Snapshot', SnapshotSchema);
//# sourceMappingURL=Snapshot.js.map