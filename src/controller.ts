import { Request, Response } from "express";
import mongoose from "mongoose";
import promisify from "util";
import {
  addGameRequestSchema,
  getGameRequestSchema,
  playMatchRequestSchema,
  ItemDbSchema,
  GameDbSchema,
} from "./models";
import { ErrorHandler } from "./error";
import {
    OK,
    CREATED,
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    NOT_FOUND
} from "http-status-codes";

export const addGame = async (req, res, next) => {
    try {
        const { error, value } = addGameRequestSchema.validate(req.body);
    
        if (error) throw new ErrorHandler(BAD_REQUEST, error);
    
        const { items, ...gameWithoutItems } = value;
    
        const Item = mongoose.model("Item", ItemDbSchema);
        const Game = mongoose.model("Game", GameDbSchema);
    
        const insertedItems = await Item.insertMany(items).catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });
    
        const newGame = new Game({
            ...gameWithoutItems,
            items: insertedItems
        });
    
        const insertedGame = await newGame.save().catch(error => {
            throw new ErrorHandler(INTERNAL_SERVER_ERROR, error)
        });
    
        res.status(CREATED).json({ insertedGame, insertedItems });
    } catch (error) {
        next(error);
    }
}

export const getGame = async (req, res, next) => {
    try {
        const { error, value } = getGameRequestSchema.validate(req.query);
    
        if (error) throw new ErrorHandler(BAD_REQUEST, error);
    
        const Game = mongoose.model("Game", GameDbSchema);
    
        const foundGame = await Game.findById(value.id).catch(error => {
            throw new ErrorHandler(BAD_REQUEST, String(error.reason))
        });
            
        if (!foundGame) return next(new ErrorHandler(NOT_FOUND, "Game not found"));
    
        res.status(OK).json({ foundGame });
    } catch (error) {
        next(error);
    }
}

export const playMatch = async (req, res, next) => {
    const { error, value } = playMatchRequestSchema.validate(req.body);
    if (error) return next(new ErrorHandler(BAD_REQUEST, error));

    const Item = mongoose.model("Item", ItemDbSchema);

    try {
        const items = await Item.find({
            '_id': {
                $in: value.items.map((itemId: string) => mongoose.Types.ObjectId(itemId))
            }
        });
        
        const returnedItemIds = items.map(item => String(item._id));
        const itemArraydifference = value.items.filter(item => !returnedItemIds.includes(item));
        if (itemArraydifference.length > 0) return next(new ErrorHandler(BAD_REQUEST, "Invalid item ids: " + itemArraydifference.join(", ")));
    } catch (error) {
        return next(new ErrorHandler(BAD_REQUEST, String(error.reason)));
    }
    next(new ErrorHandler(OK, "good."));
}


// export const playMatchHandler = async (req: Request, res: Response) => {
//   try {
//     const matchPlayReq: MatchPlayRequest = req.body;

//     const firstPlayer = await getConnection().getRepository(Item).findOne(matchPlayReq.firstPlayerId, { relations: ["game"] });
//     const secondPlayer = await getConnection().getRepository(Item).findOne(matchPlayReq.secondPlayerId, { relations: ["game"] });
    
//     if (!firstPlayer || !secondPlayer) res.json({ error: "item not found" });
//     if (firstPlayer.game.id != secondPlayer.game.id) res.json({ error: "items not from the same game" });

//     const firstPlayerProbability = (1.0 / (1.0 + Math.pow(10, ((secondPlayer.elo - firstPlayer.elo) / 400))));
//     const secondPlayerProbability = (1.0 / (1.0 + Math.pow(10, ((firstPlayer.elo - secondPlayer.elo) / 400))));

//     const kValue = 30;

//     const firstPlayerScore = matchPlayReq.winner == 1 ? 1 : 0;
//     const secondPlayerScore = matchPlayReq.winner == 1 ? 0 : 1;
    
//     const firstPlayerNewElo = firstPlayer.elo + kValue * (firstPlayerScore - firstPlayerProbability);
//     const secondPlayerNewElo = secondPlayer.elo + kValue * (secondPlayerScore - secondPlayerProbability);
    
//     const match = new Match({
//       "itemOne": firstPlayer,
//       "itemTwo": secondPlayer,
//       "itemOneOldElo": firstPlayer.elo,
//       "itemTwoOldElo": secondPlayer.elo,
//       "itemOneNewElo": firstPlayerNewElo,
//       "itemTwoNewElo": secondPlayerNewElo,
//       "winner": matchPlayReq.winner
//     });
    
//     firstPlayer.elo = firstPlayerNewElo;
//     firstPlayer.matchCount++;
//     secondPlayer.elo = secondPlayerNewElo;
//     secondPlayer.matchCount++;
    
//     res.json(await getConnection().manager.save([firstPlayer, secondPlayer, match]));
//   } catch (err) {
//     console.error(err);
//     res.json({ error: err.message || err });
//   }
// };

// export const getGameHandler = async (req: Request, res: Response) => {
//   try {
//     const gameId = req.params.gameId;

//     const items = await getConnection().getRepository(Item).find({
//       relations: ["game"],
//       where: {
//         game: {
//           id: gameId
//         }
//       },
//       order: {
//         elo: "DESC"
//       }
//     });

//     res.json(items);
//   } catch (err) {
//     console.error(err);
//     res.json({ error: err.message || err });
//   }
// };

// export const itemsForNewMatchHandler = async (req: Request, res: Response) => {
//   try {
//     const gameId = req.params.gameId;

//     const items = await getConnection().getRepository(Item).find({
//       relations: ["game"],
//       where: {
//         game: {
//           id: gameId
//         }
//       },
//       order: {
//         matchCount: "ASC"
//       },
//       take: 2
//     });

//     res.json(items);
//   } catch (err) {
//     console.error(err);
//     res.json({ error: err.message || err });
//   }
// };
