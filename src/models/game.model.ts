import mongoose from "mongoose";
import {
    IItem,
    RatingType,
    createItemSchema,
    getRatingSchema
} from "./item.model";

export interface IGame extends mongoose.Document {
    title: string,
    items: IItem[],
};

const createGameSchema = (ratingType: RatingType) => new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    items: {
        type: [createItemSchema(getRatingSchema(ratingType))],
        required: true
    }
}, { versionKey: false, strict: false });

export const getGameModel = (ratingType: RatingType) =>
    mongoose.model<IGame>("Game", createGameSchema(ratingType));
