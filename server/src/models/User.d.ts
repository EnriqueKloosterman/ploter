import mongoose, { Document } from 'mongoose';
export interface IGlobalTag {
    tagId: string;
    label: string;
    color: string;
}
export interface IUser extends Document {
    authorId: string;
    name: string;
    globalSettings: {
        theme: string;
        canvasGrid: boolean;
    };
    authorLibrary: {
        globalTags: IGlobalTag[];
        globalCharacters: any[];
    };
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
export default _default;
//# sourceMappingURL=User.d.ts.map