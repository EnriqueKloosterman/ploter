import mongoose, { Schema } from 'mongoose';
// Schemas
const CharacterSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: {
        url: String,
        width: Number,
        height: Number
    }
}, { _id: false });
const NodeSchema = new Schema({
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
const EdgeSchema = new Schema({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: String,
    targetHandle: String,
    label: String
}, { _id: false });
const BeatSchema = new Schema({
    id: { type: String, required: true },
    description: String,
    linkedNodes: [String]
}, { _id: false });
const ChapterSchema = new Schema({
    chapterId: { type: String, required: true },
    beats: [BeatSchema]
}, { _id: false });
const ProjectSchema = new Schema({
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
export default mongoose.model('Project', ProjectSchema);
//# sourceMappingURL=Project.js.map