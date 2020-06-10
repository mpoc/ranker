import mongoose from "mongoose";
import {
    OK,
    CREATED,
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    NOT_FOUND
} from "http-status-codes";
import {
    addGameRequestSchema,
    AddGameRequest,
    getGameRequestSchema,
    GetGameRequest,
    playMatchRequestSchema,
    PlayMatchRequest,
    getNewMatchRequestSchema,
    GetNewMatchRequest
} from "./models";
import {
    IGame,
    Game
} from "./models/game.model";
import {
    Item,
    IItem,
    RatingType,
    EloRating,
    Glicko2Rating
} from "./models/item.model";
import { ErrorHandler } from "./error";
import { logger } from "./utils";

export const addGame = async (req, res, next) => {
    try {
        const { error, value }: { error, value: AddGameRequest } = addGameRequestSchema.validate(req.body);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);
    
        value.items = value.items.map(item => ({
            ...item,
            rating: new EloRating()
        }));
        
        const newGame = new Game(value);
    
        const insertedGame = await newGame.save().catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });
    
        res.status(CREATED).json({ insertedGame });
    } catch (error) {
        next(error);
    }
}

export const getGame = async (req, res, next) => {
    try {
        const { error, value }: { error, value: GetGameRequest } = getGameRequestSchema.validate(req.query);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);
    
        // const gameExists = await Game.exists({ _id: value.id }).catch(error => {
        //     throw new ErrorHandler(BAD_REQUEST, error.reason)
        // });

        // if (!gameExists) throw new ErrorHandler(NOT_FOUND, "Game not found");

        // Get a game by id with its items sorted by elo.
        // In the grouping stage, you have to name each field,
        // maybe find a more decoupled way of doing it?
        const foundGame = await Game.aggregate([
            { '$match': { '_id': mongoose.Types.ObjectId(value.id) } },
            { '$unwind': { 'path': '$items' } },
            { '$sort': { 'items.rating.rating': -1 } },
            { '$group': { '_id': '$_id', 'items': { '$push': '$items' }, 'title': { '$first': '$title' } } }
        ]).exec().catch(error => { throw new ErrorHandler(INTERNAL_SERVER_ERROR, error) });

        if (!foundGame || !foundGame.length) return next(new ErrorHandler(NOT_FOUND, "Game not found"));
    
        res.status(OK).json(foundGame[0]);
    } catch (error) {
        next(error);
    }
}

export const playMatch = async (req, res, next) => {
    try {
        const { error, value }: { error, value: playMatchRequest } = playMatchRequestSchema.validate(req.body);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);

        // const items = await Item.find()
        //     .where("_id")
        //     .in(value.itemIds)
        //     .exec()
        //     .catch((error) => {
        //         throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
        //     });

        const item1 = await getItemModel(RatingType.Elo).findById(value.itemIds[0])
            .exec()
            .catch((error) => {
                throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
            });
        const item2 = await getItemModel(RatingType.Elo).findById(value.itemIds[1])
            .exec()
            .catch((error) => {
                throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
            });
        const items = [item1, item2];

        const returnedItemIds = items.map(item => String(item._id));
        const itemArraydifference = value.itemIds.filter(item => !returnedItemIds.includes(item));

        if (itemArraydifference.length > 0) throw new ErrorHandler(BAD_REQUEST, "Invalid item ids: " + itemArraydifference.join(", "));

        // TODO check if items are from the same game
        // This might require changing the schema so that items would hold a
        // single instance of a game instead of games holding instances of items

        // Disallow more than 2 items for now
        if (items.length > 2) throw new ErrorHandler(BAD_REQUEST, "Cannot play a match with more than 2 items");

        const players: IItem[] = items.map(item => item.toObject());
        const winningProbabilities = [
            (1.0 / (1.0 + Math.pow(10, ((players[1].rating.rating - players[0].rating.rating) / 400)))),
            (1.0 / (1.0 + Math.pow(10, ((players[0].rating.rating - players[1].rating.rating) / 400))))
        ];
        const kValue = 30;
        const scores = players.map((player, index) => index == value.winnerIndex ? 1 : 0);
        const newElo = players.map((player, index) => players[index].rating.rating + kValue * (scores[index] - winningProbabilities[index]));

        // Possibly create a match entry here to track progress

        newElo.map((elo, index) => {
            items[index].rating.rating = elo;
            items[index].matchCount++;
        });

        // This is not very good. Figure out a way to bulk save.
        const itemsToSave = items.map(async (item) => 
            await item.save().catch(error => {
                throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
            })
        );
        const savedItems = await Promise.all(itemsToSave);
        
        res.status(OK).json({ savedItems });
    } catch (error) {
        next(error);
    }
}

export const getNewMatch = async (req, res, next) => {
    try {
        const { error, value }: { error, value: getNewMatchRequest } = getNewMatchRequestSchema.validate(req.query);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);

        const gameExists = await getGameModel(RatingType.Elo).exists({ _id: value.gameId }).catch(error => {
            throw new ErrorHandler(BAD_REQUEST, error.reason)
        });

        if (!gameExists) throw new ErrorHandler(NOT_FOUND, "Game not found");

        // Get a game, get it's items, sort them in ascending order by
        // matchCount and get the first two
        // const itemsForGame = await Game.aggregate([
        //     { '$match': { '_id': mongoose.Types.ObjectId(value.gameId) } },
        //     { '$project': { '_id': false, 'items': true } },
        //     { '$lookup': { 'from': 'items', 'localField': 'items', 'foreignField': '_id', 'as': 'items' } },
        //     { '$unwind': { 'path': '$items' } },
        //     { '$replaceRoot': { 'newRoot': { '$mergeObjects': [ '$$ROOT', '$items' ] } } },
        //     { '$project': { 'items': false } },
        //     { '$sort': { 'matchCount': 1 } },
        //     { '$limit': 2 }
        // ]).exec().catch(error => { throw new ErrorHandler(INTERNAL_SERVER_ERROR, error) });

        // const itemsForGame = await Game.aggregate([
        //     { '$match': { '_id': mongoose.Types.ObjectId(value.gameId) } },
        //     { '$project': { '_id': false, 'items': true } },
        //     { '$lookup': { 'from': 'items', 'localField': 'items', 'foreignField': '_id', 'as': 'items' } },
        //     { '$unwind': { 'path': '$items' } },
        //     { '$replaceRoot': { 'newRoot': { '$mergeObjects': [ '$$ROOT', '$items' ] } } },
        //     { '$project': { 'items': false } },
        //     { '$sample': { 'size': 2 } }
        // ]).exec().catch(error => { throw new ErrorHandler(INTERNAL_SERVER_ERROR, error) });

        const game = await getGameModel(RatingType.Elo).findById(value.gameId).exec().catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });

        const count = game.items.length;
        const numbers = [...Array(count).keys()];
        const shuffledNumbers = numbers.reduce( 
            (newArr, _, i) => {
                var rand = i + ( Math.floor( Math.random() * (newArr.length - i) ) );
                [newArr[rand], newArr[i]] = [newArr[i], newArr[rand]]
                return newArr
            }, [...numbers]
        )

        const item1 = await getItemModel(RatingType.Elo).findById(game.items[shuffledNumbers[0]]).exec().catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });
        const item2 = await getItemModel(RatingType.Elo).findById(game.items[shuffledNumbers[1]]).exec().catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });

        const itemsForGame = [item1, item2];

        res.status(OK).json({ itemsForGame });
    } catch (error) {
        next(error);
    }
}

export const vote = async (req, res, next) => {
    res.render("vote.pug");
}

export const viewRatings = async (req, res, next) => {
  res.render("ratings.pug");
};
