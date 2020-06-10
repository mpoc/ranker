import mongoose from "mongoose";

export interface IItem extends mongoose.Document {
    title: string,
    url: string,
    matchCount: number,
    rating: IRating
};

export interface IRating extends mongoose.Document {
    rating: number;
}

export interface IEloRating extends IRating {}

export interface IGlicko2Rating extends IRating {
    defaultRating: number;
    ratingDeviation: number;
    tau: number;
    volatility: number;
}

export enum RatingType {
    Elo,
    Glicko2
}

const EloRatingSchema = new mongoose.Schema({
    elo: {
        type: Number,
        default: 1000.0,
        required: true
    }
}, { versionKey: false });

const Glicko2RatingSchema = new mongoose.Schema({
    defaultRating: {
        type: Number,
        default: 1500.0,
        required: true
    },
    rating: {
        type: Number,
        default: 1500.0,
        required: true        
    },
    ratingDeviation: {
        type: Number,
        default: 350.0,
        required: true        
    },
    tau: {
        type: Number,
        default: 0.5,
        required: true        
    },
    volatility: {
        type: Number,
        default: 0.06,
        required: true        
    }
}, { versionKey: false });

export const getRatingSchema = (ratingType: RatingType) => {
    switch (ratingType) {
        case RatingType.Elo: {
            return EloRatingSchema;
            break;
        }
        case RatingType.Elo: {
            return Glicko2RatingSchema;
            break;
        }
    }
}

export const createItemSchema = (ratingSchema: mongoose.Schema) => new mongoose.Schema({
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
    rating: {
        type: ratingSchema,
        default: () => ({}),
        required: true
    }
}, { versionKey: false, strict: false });

export const getItemModel = (ratingType: RatingType) =>
    mongoose.model<IItem>("Item", createItemSchema(getRatingSchema(ratingType)));
