import mongoose, { Schema } from 'mongoose';
const GlobalTagSchema = new Schema({
    tagId: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, required: true }
}, { _id: false });
const UserSchema = new Schema({
    authorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    globalSettings: {
        theme: { type: String, default: 'dark' },
        canvasGrid: { type: Boolean, default: true }
    },
    authorLibrary: {
        globalTags: [GlobalTagSchema],
        globalCharacters: [{ type: Schema.Types.Mixed }]
    }
}, { timestamps: true });
export default mongoose.model('User', UserSchema);
//# sourceMappingURL=User.js.map