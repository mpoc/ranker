import mongoose from "mongoose";
import {
    IItem,
    ItemSchema
} from "./item.model";

export interface IGame extends mongoose.Document {
    title: string,
    items: IItem[],
};

export const GameSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    items: {
        type: [ItemSchema],
        required: true
    }
}, { versionKey: false });

export const Game = mongoose.model<IGame>("Game", GameSchema);
