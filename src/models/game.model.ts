import mongoose from "mongoose";
import { IItem } from "./item.model";

export interface IGame extends mongoose.Document {
    title: string,
    items: IItem['_id'],
};

const GameSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    items: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    }
}, { versionKey: false });

export default mongoose.model<IGame>("Game", GameSchema);
