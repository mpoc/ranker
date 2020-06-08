import Joi from "@hapi/joi";

export const addGameRequestSchema = Joi.object({
    title: Joi.string().required(),
    items: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            url: Joi.string().required()
        }
    )).min(2).required()
});

export type addGameRequest = {
    title: string,
    items: {
        title: string,
        url: string
    }
}

export const getGameRequestSchema = Joi.object({
    id: Joi.string().required()
})

export type getGameRequest = {
    id: string
};

export const playMatchRequestSchema = Joi.object({
    itemIds: Joi.array().items(
        Joi.string().required()
    ).min(2).unique().required(),
    winnerIndex: Joi.number().integer().min(0).max(Joi.ref('itemIds', { adjust: (value) => value.length - 1 })).required()
})

export type playMatchRequest = {
    itemIds: string[],
    winnerIndex: number
}

export const getNewMatchRequestSchema = Joi.object({
    gameId: Joi.string().required()
})

export type getNewMatchRequest = {
    gameId: string
}
