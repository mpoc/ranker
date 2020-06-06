import db from "./database.ts";
import { Game, Item } from "./types.ts";
import { Context } from 'https://deno.land/x/oak/mod.ts';

// export const getGame = async (req: Request, res: Response) => {}
// export const getItemsForNewMatch = async (req: Request, res: Response) => {}
// export const playMatch = async (req: Request, res: Response) => {}

const games = db.collection("games");

export const addGame = async (context: Context) => {

    const body = await context.request.body();

    if (context.request.headers.get("content-type") !== "application/json") {
        console.log("oi wtf 422")
    }

    if (!context.request.hasBody) {
        context.response.status = 400
        context.response.body = {
            success: false,
            msg: 'No data'
        }
    } else {
        const game: Game = body.value;
        const insertedGame = await games.insertOne(game);
        context.response.status = 201
        context.response.body = {
            success: true,
            data: insertedGame
        }
    }
}

export const getVotePage = async (context: any) => {
    context.render('./views/vote.ejs', {
        firstTitle: "Hello",
        secondTitle: "world"
    });
}
