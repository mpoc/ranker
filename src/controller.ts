import mongoose from "mongoose";
import {
    OK,
    CREATED,
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    NOT_FOUND
} from "http-status-codes";
import Player, { Outcome, Match, OutcomeReport } from 'glicko-two';
import metascraper from "metascraper";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import axios from "axios";
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
    AddItemsRequest,
    autoAddGameRequestSchema,
    AutoAddGameRequest,
    ItemToAdd
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
import { respond, shuffle, getRandomInt, getRandomItem, logger, shiftValueToRange, limitValue } from "./utils";

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

export const autoAddGame = async (req, res, next) => {
    try {
        const { error, value }: { error, value: AutoAddGameRequest } = autoAddGameRequestSchema.validate(req.body);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);

        // Temporary "rate limiting"
        if (value.itemUrls.length > 10) throw new ErrorHandler(BAD_REQUEST, "Too many items to retrieve data for");

        const urlsHtml = await Promise.all(
            value.itemUrls.map(async url => ({
                url: url,
                response: await axios.get(url)
            }))
        );

        const scraper = metascraper([
            metascraperImage(),
            metascraperTitle(),
            metascraperUrl(),
        ]);

        const metadataArray: {
            title: string,
            url: string,
            image: string
        }[] = await Promise.all(
            urlsHtml.map(
                async ({ url, response }) =>
                await scraper({ html: response.data, url: url })
            )
        );

        const formattedMetadataArray: ItemToAdd[] =
            metadataArray.map(item => ({
                title: item.title,
                url: item.url,
                imageUrl: item.image
            }));
    
        respond({
            success: true,
            message: "Auto game data retrieved successfully",
            data: {
                items: formattedMetadataArray
            }
        }, OK, res);
    } catch (error) {
        next(error);
    }
}

export const getGame = async (req, res, next) => {
    try {
        const { error, value }: { error, value: GetGameRequest } = getGameRequestSchema.validate(req.query);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);
    
        // Get a game by id with its items sorted by elo.
        // In the grouping stage, you have to name each field,
        // maybe find a more decoupled way of doing it?
        const foundGame = await Game.aggregate([
            { '$match': { '_id': mongoose.Types.ObjectId(value.id) } },
            { '$unwind': { 'path': '$items' } },
            { '$sort': { 'items.rating.rating': -1 } },
            { '$group': { '_id': '$_id', 'items': { '$push': '$items' }, 'title': { '$first': '$title' }, 'itemPlaceChanges': { '$first': '$itemPlaceChanges' } } }
        ]).exec().catch(error => { throw new ErrorHandler(INTERNAL_SERVER_ERROR, error) });

        if (!foundGame || !foundGame.length) throw new ErrorHandler(NOT_FOUND, "Game not found");
    
        respond({
            success: true,
            message: "Game found",
            data: foundGame[0]
        }, OK, res);
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

        let items = game.items.filter(item => value.itemIds.includes(String(item._id)))
        
        if (items.length != value.itemIds.length) {
            throw new ErrorHandler(BAD_REQUEST, "Some item ids invalid or belong to different games");
        }

        // const returnedItemIds = items.map(item => String(item._id));
        // const itemArraydifference = value.itemIds.filter(item => !returnedItemIds.includes(item));

        // if (itemArraydifference.length > 0) throw new ErrorHandler(BAD_REQUEST, "Invalid item ids: " + itemArraydifference.join(", "));

        // Disallow more than 2 items for now
        if (items.length > 2) throw new ErrorHandler(BAD_REQUEST, "Cannot play a match with more than 2 items");

        const itemsBeforeVote = [...game.items]
            .sort((a, b) => b.rating.rating - a.rating.rating)
            .map(item => String(item._id));

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

        const itemsAfterVote = [...game.items]
            .sort((a, b) => b.rating.rating - a.rating.rating)
            .map((item) => String(item._id));

        game.itemPlaceChanges.push(calculateNumberOfDifferences(itemsBeforeVote, itemsAfterVote));

        const accuracy = calculateAccuracy(game);

        game.markModified('items');
        game.markModified("itemPlaceChanges");
        const savedGame = await game.save().catch((error) => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error);
        });

        respond({
            success: true,
            message: "Items updated successfully",
            data: {
                accuracy,
                items
            }
        }, OK, res);
    } catch (error) {
        next(error);
    }
}

// Calculates the number differences in the array
const calculateNumberOfDifferences = (array1: any[], array2: any[]) => {
    return array1.reduce((sum, item, index) => sum + (item != array2[index] ? 1 : 0), 0);
}

// Calculates the average from a number array
const average = (array: number[]) => {
    return (array.reduce((a, b) => a + b, 0) / array.length) || 0;
}

// Calculates the rolling average for the last n elements of array
const calculateRollingAverage = (array: number[], N: number) => {
    return average(array.slice(-N));
}

const calculateNForRunningAvg = (length: number) => {
    const minimumNumberOfElements = 20;
    return Math.max(
        Math.floor(3 * Math.sqrt(length)),
        minimumNumberOfElements
    );
}

const calculateLastVoteAccuracy = (totalNumberOfItems: number, changeArray: number[]) => {
    if (changeArray.length < 1) return 0;

    const N = calculateNForRunningAvg(totalNumberOfItems);
    const rollingAverage = calculateRollingAverage(changeArray, N);

    // Maybe calculate not from total number of items?
    const avgChangesProportion = rollingAverage / totalNumberOfItems;

    // If changeArray.length is less than N, the accuracy metric is inaccurate
    // because less than N votes have been made. Make accuracy suffer a penalty
    // if it is inaccurate.
    const INACCURATE_ACCURACY_PENALTY = 0.3;
    const accuracyPenalty =
        changeArray.length < N
            ? INACCURATE_ACCURACY_PENALTY
            : 0;
    const accuracyPenaltyComplement = 1 - accuracyPenalty;

    const accuracy = (1 - avgChangesProportion) * accuracyPenaltyComplement;
    
    return accuracy;
}

const calculateAccuracy = (game: IGame) => {
    if (game.items[0].rating.ratingType == RatingType.Glicko2) {
        const averageRD = average(game.items.map(item => item.rating.ratingDeviation));
        const accuracy = convertRDtoAccuracy(averageRD);
        return accuracy;
    } else if (game.items[0].rating.ratingType == RatingType.Elo) {
        // Fallback for Elo
        const accuracy = calculateLastVoteAccuracy(game.items.length, game.itemPlaceChanges);
        return accuracy;
    }
}

const convertRDtoAccuracy = (ratingDeviation: number) => {
    const DEFAULT_RATING_DEVIATION = 350;
    // https://lichess.org/faq#provisional
    const HIGHEST_CONFIDENCE_RATING_DEVIATION = 120;

    const unboundedAccuracy =
        shiftValueToRange(
            -ratingDeviation,
            -DEFAULT_RATING_DEVIATION, -HIGHEST_CONFIDENCE_RATING_DEVIATION,
            0, 1
        );
    const accuracy = limitValue(unboundedAccuracy, 0, 1);
    return accuracy;
}

export const getNewMatch = async (req, res, next) => {
    try {
        const { error, value }: { error, value: GetNewMatchRequest } = getNewMatchRequestSchema.validate(req.query);
        if (error) throw new ErrorHandler(BAD_REQUEST, error);

        const game = await Game.findById(value.gameId).exec().catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });

        if (!game) throw new ErrorHandler(NOT_FOUND, "Game not found");

        if (game.items.length < 2) throw new ErrorHandler(BAD_REQUEST, "Game does not contain enough items for a match")

        const itemsForGame = getItemsForNewMatch(game);
        const accuracy = calculateAccuracy(game);

        respond({
            success: true,
            message: "Items found",
            data: {
                accuracy,
                items: itemsForGame
            }
        }, OK, res);
    } catch (error) {
        next(error);
    }
}

const getItemsForNewMatch = (game: IGame) => {
    const random = Math.random();
    if (random < 0.5) {
        // Get just two random items

        // Copying the array just in case
        const items = shuffle([...game.items]);
        
        const itemsForGame = [items[0], items[1]];
        return itemsForGame;
    } else {
        // Pick one random item from the bottom 30% of rating deviation and one random item

        // DANGER: Possible to get no item if there are not enough items
        // DANGER: Items might be Elo, so no RD

        const sortedByDeviation = game.items.sort((a, b) => b.rating.ratingDeviation - a.rating.ratingDeviation);
        const untilIndex = Math.ceil(0.3 * sortedByDeviation.length);
        const lowerHalf = sortedByDeviation.slice(0, untilIndex);

        const deviationItem = getRandomItem(lowerHalf);
        const removedDeviationItemArray = game.items.filter(item => item != deviationItem);
        const randomItem = getRandomItem(removedDeviationItemArray);

        const itemsForGame = shuffle([deviationItem, randomItem]);
        return itemsForGame;
    }
    // TODO: Add case where two items from bottom 30% are taken
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

export const autoCreateGame = async (req, res, next) => {
    res.render("autocreate.pug");
};

export const createGame = async (req, res, next) => {
    res.render("create.pug");
};
