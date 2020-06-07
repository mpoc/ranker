import * as mongoose from "mongoose";

const Schema = mongoose.Schema;

export const ItemSchema = new Schema({
    title: String,
    url: String,
    matchCount: {
        type: Number,
        default: 0
    },
    elo: {
        type: Number,
        default: 1000.0
    }
});

export const GameSchema = new Schema({
    title: String,
    items: [Schema.Types.ObjectId]
});
