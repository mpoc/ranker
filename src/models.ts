import mongoose from "mongoose";
import Joi from "@hapi/joi";

const Schema = mongoose.Schema;

export const ItemDbSchema = new Schema(
{
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
}, { versionKey: false });

export const GameDbSchema = new Schema({
    title: String,
    items: [Schema.Types.ObjectId]
}, { versionKey: false });

export const addGameRequestSchema = Joi.object({
    title: Joi.string().required(),
    items: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            url: Joi.string().required()
        }
    )).required()
});

export const getGameRequestSchema = Joi.object({
    id: Joi.string().required()
})

export const playMatchRequestSchema = Joi.object({
    items: Joi.array().items(
        Joi.string().required()
    ).min(2).unique().required(),
    winnerIndex: Joi.number().integer().min(0).max(Joi.ref('items', { adjust: (value) => value.length - 1 })).required()
})
