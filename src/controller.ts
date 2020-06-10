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
import { EloPlayer, EloMatch } from "./ratings/elo";

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
        const { error, value }: { error, value: PlayMatchRequest } = playMatchRequestSchema.validate(req.body);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);

        const game = await Game.findOne({
            "items._id": value.itemIds[0],
        }).exec().catch((error) => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
        });

        const items = game.items.filter(item => value.itemIds.includes(String(item._id)))
        
        if (items.length != value.itemIds.length) {
            throw new ErrorHandler(BAD_REQUEST, "Some item ids invalid or belong to different games");
        }

        // const returnedItemIds = items.map(item => String(item._id));
        // const itemArraydifference = value.itemIds.filter(item => !returnedItemIds.includes(item));

        // if (itemArraydifference.length > 0) throw new ErrorHandler(BAD_REQUEST, "Invalid item ids: " + itemArraydifference.join(", "));

        // Disallow more than 2 items for now
        if (items.length > 2) throw new ErrorHandler(BAD_REQUEST, "Cannot play a match with more than 2 items");

        const players = items.map(item => new EloPlayer(item.rating.rating));
        const eloMatch = new EloMatch();
        eloMatch.updateRatings(players, items.map(item => item._id == value.winnerId));

        // Possibly create a match entry here to track progress

        items[0].rating.rating = players[0].rating;
        items[0].matchCount++;
        items[1].rating.rating = players[1].rating;
        items[1].matchCount++;

        game.markModified('items');
        const savedGame = await game.save().catch((error) => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
        });

        res.status(OK).json({ items });
    } catch (error) {
        next(error);
    }
}

export const getNewMatch = async (req, res, next) => {
    try {
        const { error, value }: { error, value: GetNewMatchRequest } = getNewMatchRequestSchema.validate(req.query);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);

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

        // Get two random items from a game
        // const itemsForGame = await Game.aggregate([
        //     { '$match': { '_id': mongoose.Types.ObjectId(value.gameId) } },
        //     { '$project': { '_id': false, 'items': true } },
        //     { '$lookup': { 'from': 'items', 'localField': 'items', 'foreignField': '_id', 'as': 'items' } },
        //     { '$unwind': { 'path': '$items' } },
        //     { '$replaceRoot': { 'newRoot': { '$mergeObjects': [ '$$ROOT', '$items' ] } } },
        //     { '$project': { 'items': false } },
        //     { '$sample': { 'size': 2 } }
        // ]).exec().catch(error => { throw new ErrorHandler(INTERNAL_SERVER_ERROR, error) });

        const game = await Game.findById(value.gameId).exec().catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });

        if (!game) throw new ErrorHandler(NOT_FOUND, "Game not found");

        const count = game.items.length;
        const numbers = [...Array(count).keys()];
        const shuffledNumbers = numbers.reduce( 
            (newArr, _, i) => {
                var rand = i + ( Math.floor( Math.random() * (newArr.length - i) ) );
                [newArr[rand], newArr[i]] = [newArr[i], newArr[rand]]
                return newArr
            }, [...numbers]
        )

        const itemsForGame = [
            game.items[shuffledNumbers[0]],
            game.items[shuffledNumbers[1]]
        ];

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
