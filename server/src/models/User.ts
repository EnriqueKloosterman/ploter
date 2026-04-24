import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalTag {
  tagId: string;
  label: string;
  color: string;
}

export interface IUser extends Document {
  authorId: string; // auth_9921
  name: string;
  globalSettings: {
    theme: string;
    canvasGrid: boolean;
  };
  authorLibrary: {
    globalTags: IGlobalTag[];
    globalCharacters: any[]; // Extended later if needed
  };
}

const GlobalTagSchema = new Schema<IGlobalTag>({
  tagId: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, required: true }
}, { _id: false });

const UserSchema = new Schema<IUser>({
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

export default mongoose.model<IUser>('User', UserSchema);
