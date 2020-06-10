import mongoose from "mongoose";

export enum RatingType {
    Elo = "Elo",
    Glicko2 = "Glicko2"
}

export interface IRating extends mongoose.Document {
    ratingType: RatingType
    rating: number;
}

const RatingSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true
    }
}, { versionKey: false, discriminatorKey: 'ratingType' });

export interface IEloRating extends IRating {}

const EloRatingSchema = new mongoose.Schema({
    rating: {
        type: Number,
        default: 1000.0,
        required: true
    }
}, { versionKey: false });

export interface IGlicko2Rating extends IRating {
    ratingDeviation: number;
    tau: number;
    volatility: number;
}

const Glicko2RatingSchema = new mongoose.Schema({
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

export interface IItem extends mongoose.Document {
    title: string,
    url: string,
    matchCount: number,
    rating: IRating
};

export const ItemSchema = new mongoose.Schema({
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
        type: RatingSchema,
        required: true
    }
}, { versionKey: false });

// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30714
export const EloRating = (ItemSchema.path("rating") as mongoose.Schema.Types.DocumentArray)
    .discriminator<IEloRating>("Elo", EloRatingSchema);
export const Glicko2Rating = (ItemSchema.path("rating") as mongoose.Schema.Types.DocumentArray)
    .discriminator<IGlicko2Rating>("Glicko2", Glicko2RatingSchema);

export const Item = mongoose.model<IItem>("Item", ItemSchema);
