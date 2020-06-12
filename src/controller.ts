import mongoose from "mongoose";
import {
    OK,
    CREATED,
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    NOT_FOUND
} from "http-status-codes";
import Player, { Outcome, Match, OutcomeReport } from 'glicko-two';
import {
    addGameRequestSchema,
    AddGameRequest,
    getGameRequestSchema,
    GetGameRequest,
    playMatchRequestSchema,
    PlayMatchRequest,
    getNewMatchRequestSchema,
    GetNewMatchRequest,
    addItemsRequestSchema,
    AddItemsRequest
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
    Glicko2Rating,
    IGlicko2Rating,
    IEloRating
} from "./models/item.model";
import { ErrorHandler } from "./error";
import { EloPlayer, EloMatch } from "./ratings/elo";
import { respond, shuffle, getRandomInt, getRandomItem, logger } from "./utils";

export const addGame = async (req, res, next) => {
    try {
        const { error, value }: { error, value: AddGameRequest } = addGameRequestSchema.validate(req.body);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);
    
        // Items is optional, if not provided, create a game without items
        if (value.items) {
            value.items = value.items.map(item => ({
                ...item,
                rating: new Glicko2Rating()
            }));
        }
        
        const newGame = new Game(value);
    
        const insertedGame = await newGame.save().catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });
    
        respond({
            success: true,
            message: "Game created successfully",
            data: insertedGame
        }, CREATED, res);
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
    
        respond({
            success: true,
            message: "Game found",
            data: foundGame[0]
        }, OK, res);
    } catch (error) {
        next(error);
    }
}

// let changes = [];

export const playMatch = async (req, res, next) => {
    try {
        const { error, value }: { error, value: PlayMatchRequest } = playMatchRequestSchema.validate(req.body);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);

        const game = await Game.findOne({
            "items._id": value.itemIds[0],
        }).exec().catch((error) => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
        });

        let items = game.items.filter(item => value.itemIds.includes(String(item._id)))
        
        if (items.length != value.itemIds.length) {
            throw new ErrorHandler(BAD_REQUEST, "Some item ids invalid or belong to different games");
        }

        // const returnedItemIds = items.map(item => String(item._id));
        // const itemArraydifference = value.itemIds.filter(item => !returnedItemIds.includes(item));

        // if (itemArraydifference.length > 0) throw new ErrorHandler(BAD_REQUEST, "Invalid item ids: " + itemArraydifference.join(", "));

        // Disallow more than 2 items for now
        if (items.length > 2) throw new ErrorHandler(BAD_REQUEST, "Cannot play a match with more than 2 items");

        // const itemsBeforeVote = (await Game.aggregate([
        //     { '$match': { '_id': mongoose.Types.ObjectId(game._id) } },
        //     { '$unwind': { 'path': '$items' } },
        //     { '$sort': { 'items.rating.rating': -1 } },
        //     { '$group': { '_id': '$_id', 'items': { '$push': '$items' }, 'title': { '$first': '$title' } } }
        // ]).exec())[0].items;

        // Needs decoupling
        if (items[0].rating.ratingType == RatingType.Elo) {
            const players = items.map((item) => new EloPlayer(item.rating.rating));
            const eloMatch = new EloMatch();
            eloMatch.updateRatings(players, items.map(item => item._id == value.winnerId));

            items[0].rating.rating = players[0].rating;
            items[0].matchCount++;
            items[1].rating.rating = players[1].rating;
            items[1].matchCount++;
        } else if (items[0].rating.ratingType == RatingType.Glicko2) {
            const players = items.map((item) => new Player({
                defaultRating: 1500,
                rating: item.rating.rating,
                ratingDeviation: item.rating.ratingDeviation,
                tau: item.rating.tau,
                volatility: item.rating.volatility
            }));
            
            const match = new Match(players[0], players[1]);
            const a = items.map(item => item._id == value.winnerId ? 1 : 0) as OutcomeReport;
            match.reportOutcome(a);
            match.updatePlayerRatings();

            items[0].rating.rating = players[0].rating;
            items[0].rating.ratingDeviation = players[0].ratingDeviation;
            items[0].rating.volatility = players[0].volatility;
            items[0].matchCount++;

            items[1].rating.rating = players[1].rating;
            items[1].rating.ratingDeviation = players[1].ratingDeviation;
            items[1].rating.volatility = players[1].volatility;
            items[1].matchCount++;
        }

        game.markModified('items');
        const savedGame = await game.save().catch((error) => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
        });

        // let itemsAfterVote = (await Game.aggregate([
        //     { '$match': { '_id': mongoose.Types.ObjectId(game._id) } },
        //     { '$unwind': { 'path': '$items' } },
        //     { '$sort': { 'items.rating.rating': -1 } },
        //     { '$group': { '_id': '$_id', 'items': { '$push': '$items' }, 'title': { '$first': '$title' } } }
        // ]).exec())[0].items;

        // const numberOfChangedElements = 
        //     itemsBeforeVote.reduce(
        //         (sum, item, index) => 
        //             sum + ((String(item._id) != String(itemsAfterVote[index]._id)) ? 1 : 0)
        //     , 0);
        // changes.push(numberOfChangedElements);
        // const n = 14;
        // const lastN = changes.slice(-n);
        // const avg = lastN.reduce((a, b) => a + b, 0) / ((lastN.length < n) ? lastN.length : n);
        // logger.info("Average number of changed elements: " + avg);

        respond({
            success: true,
            message: "Items updated successfully",
            data: items
        }, OK, res);
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

        if (game.items.length < 2) throw new ErrorHandler(BAD_REQUEST, "Game does not contain enough items for a match")

        let itemsForGame;
        
        // Either
        // Pick two items at random OR
        // Pick one random item from the bottom 30% of rating deviation and one random item
        const random = Math.random();
        console.log(random);
        if (random < 0.5) {
            // Get just two random items
            let items = game.items;
            shuffle(items);
            itemsForGame = [items[0], items[1]];
        } else {
            // Get two random items from the part with high rating deviation
            // Possible to get no item if there are not enough items
            const sortedByDeviation = game.items.sort((a, b) => b.rating.ratingDeviation - a.rating.ratingDeviation);
            const untilIndex = Math.ceil(0.3 * sortedByDeviation.length);
            const lowerHalf = sortedByDeviation.slice(0, untilIndex);

            const deviationItem = getRandomItem(lowerHalf);
            const removedDeviationItemArray = game.items.filter(item => item != deviationItem);
            const randomItem = getRandomItem(removedDeviationItemArray);

            itemsForGame = [deviationItem, randomItem];
            shuffle(itemsForGame);
        }

        respond({
            success: true,
            message: "Items found",
            data: itemsForGame
        }, OK, res);
    } catch (error) {
        next(error);
    }
}

export const addItems = async (req, res, next) => {
    try {
        const { error, value }: { error, value: AddItemsRequest } = addItemsRequestSchema.validate(req.body);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);

        const game = await Game.findById(value.gameId).exec().catch((error) => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
        });

        if (!game) throw new ErrorHandler(NOT_FOUND, "Game not found");

        const items = value.items.map(item => new Item({
            ...item,
            rating: new Glicko2Rating()
        }));
        game.items.push(...items);

        game.markModified('items');
        const updatedGame = await game.save().catch((error) => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
        });

        respond({
            success: true,
            message: "Items added to game",
            data: items
        }, OK, res);
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
