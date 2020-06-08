import mongoose from "mongoose";

export interface IItem extends mongoose.Document {
    title: string,
    url: string,
    matchCount: number,
    elo: number
};

const ItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    matchCount: {
        type: Number,
        default: 0,
        required: true
    },
    elo: {
        type: Number,
        default: 1000.0,
        required: true
    }
}, { versionKey: false });

export default mongoose.model<IItem>("Item", ItemSchema);
