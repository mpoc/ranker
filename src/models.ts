import Joi from "@hapi/joi";
import { IRating } from "./models/item.model";

export const addGameRequestSchema = Joi.object({
    title: Joi.string().required(),
    items: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            url: Joi.string().required()
        }
    )).min(2).required()
});

export type AddGameRequest = {
    title: string,
    items: {
        title: string,
        url: string,
        rating?: IRating
    }[]
}

export const getGameRequestSchema = Joi.object({
    id: Joi.string().required()
})

export type GetGameRequest = {
    id: string
};

export const playMatchRequestSchema = Joi.object({
    itemIds: Joi.array().items(
        Joi.string().required()
    ).min(2).unique().required(),
    winnerIndex: Joi.number().integer().min(0).max(Joi.ref('itemIds', { adjust: (value) => value.length - 1 })).required()
})

export type PlayMatchRequest = {
    itemIds: string[],
    winnerIndex: number
}

export const getNewMatchRequestSchema = Joi.object({
    gameId: Joi.string().required()
})

export type GetNewMatchRequest = {
    gameId: string
}
