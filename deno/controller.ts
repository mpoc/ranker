import db from "./database.ts";
import { Game, Item } from "./types.ts";
import { Context } from 'https://deno.land/x/oak/mod.ts';

export const getGameById = async (context: any) => {
    if (context.params && context.params.gameId) {
        const gamesDb = db.collection("games");
        const game = await gamesDb.findOne({ _id: { "$oid": context.params.gameId } });
        if (game) {
            context.response.status = 200;
            context.response.body = {
                success: true,
                data: game
            }
        } else {
            context.response.status = 400;
            context.response.body = {
                success: true,
                msg: 'No such user'
            }
        }
    } else {
        context.response.status = 400;
        context.response.body = {
            success: false,
            msg: 'No data'
        }
    }
}

export const addGame = async (context: Context) => {
    const body = await context.request.body();

    // if (context.request.headers.get("content-type") !== "application/json") {
    //     console.log("422")
    // }

    if (!context.request.hasBody) {
        context.response.status = 400
        context.response.body = {
            success: false,
            msg: 'No data'
        }
    } else {

        const gamesDb = db.collection("games");
        const itemsDb = db.collection("items");

        const items = body.value.items.map((item: Item) => ({
            ...item,
            matchCount: 0,
            elo: 1000
        }));

        const insertedItems = await itemsDb.insertMany(items);

        const game: Game = body.value;
        game.items = insertedItems.map((itemIdObj: { $oid: string }) => ({_id: { $oid: itemIdObj.$oid }}));

        const insertedGame = await gamesDb.insertOne(game);

        context.response.status = 201
        context.response.body = {
            success: true,
            data: {
                insertedItems,
                insertedGame
            }
        }
    }
}

export const getVotePage = async (context: any) => {
    context.render('./views/vote.ejs', {
        firstTitle: "Hello",
        secondTitle: "world"
    });
}

// export const getItemsForNewMatch = async (req: Request, res: Response) => {}
// export const playMatch = async (req: Request, res: Response) => {}