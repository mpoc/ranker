import * as mongoose from "mongoose";
import Joi from "@hapi/joi";


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

export const addGameValidator = Joi.object({
    title: Joi.string().required(),
    items: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            url: Joi.string().required()
        }
    )).required()
});
