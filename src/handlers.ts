import { Request, Response } from "express";
import { getConnection } from "typeorm";
import { Item } from "./entity/Item";
import { Game } from "./entity/Game";
import { Match } from "./entity/Match";

interface HelloResponse {
  hello: string;
}

type HelloBuilder = (name: string) => HelloResponse;

const helloBuilder: HelloBuilder = name => ({ hello: name });

export const rootHandler = (_req: Request, res: Response) => {
  return res.send("API is working 🤓");
};

export const helloHandler = (req: Request, res: Response) => {
  const { params } = req;
  const { name = "World" } = params;
  const response = helloBuilder(name);

  return res.json(response);
};

interface AddGameRequest {
  title: string;
  items: { title: string; url: string }[];
}

export const addGameHandler = async (req: Request, res: Response) => {
  try {
    const addGameReq: AddGameRequest = req.body;

    const game = new Game({
      "title": addGameReq.title,
      "items": addGameReq.items.map(item => new Item(item))
    });
    
    res.json(await getConnection().manager.save(game));
  } catch (err) {
    console.error(err);
    res.json({ error: err.message || err });
  }
};

interface MatchPlayRequest {
  firstPlayerId: number;
  secondPlayerId: number;
  winner: 1 | 2;
}

export const playMatchHandler = async (req: Request, res: Response) => {
  try {
    const matchPlayReq: MatchPlayRequest = req.body;

    const firstPlayer = await getConnection().getRepository(Item).findOne(matchPlayReq.firstPlayerId, { relations: ["game"] });
    const secondPlayer = await getConnection().getRepository(Item).findOne(matchPlayReq.secondPlayerId, { relations: ["game"] });
    
    if (!firstPlayer || !secondPlayer) res.json({ error: "item not found" });
    if (firstPlayer.game.id != secondPlayer.game.id) res.json({ error: "items not from the same game" });

    const firstPlayerProbability = (1.0 / (1.0 + Math.pow(10, ((secondPlayer.elo - firstPlayer.elo) / 400))));
    const secondPlayerProbability = (1.0 / (1.0 + Math.pow(10, ((firstPlayer.elo - secondPlayer.elo) / 400))));

    const kValue = 30;

    const firstPlayerScore = matchPlayReq.winner == 1 ? 1 : 0;
    const secondPlayerScore = matchPlayReq.winner == 1 ? 0 : 1;
    
    const firstPlayerNewElo = firstPlayer.elo + kValue * (firstPlayerScore - firstPlayerProbability);
    const secondPlayerNewElo = secondPlayer.elo + kValue * (secondPlayerScore - secondPlayerProbability);
    
    const match = new Match({
      "itemOne": firstPlayer,
      "itemTwo": secondPlayer,
      "itemOneOldElo": firstPlayer.elo,
      "itemTwoOldElo": secondPlayer.elo,
      "itemOneNewElo": firstPlayerNewElo,
      "itemTwoNewElo": secondPlayerNewElo,
      "winner": matchPlayReq.winner
    });
    
    firstPlayer.elo = firstPlayerNewElo;
    firstPlayer.matchCount++;
    secondPlayer.elo = secondPlayerNewElo;
    secondPlayer.matchCount++;
    
    res.json(await getConnection().manager.save([firstPlayer, secondPlayer, match]));
  } catch (err) {
    console.error(err);
    res.json({ error: err.message || err });
  }
};

export const getGameHandler = async (req: Request, res: Response) => {
  try {
    const gameId = req.params.gameId;

    const games = await getConnection().getRepository(Item).find({
      relations: ["game"],
      where: {
        game: {
          id: gameId
        }
      },
      order: {
        elo: "DESC"
      }
    });

    res.json(games);
  } catch (err) {
    console.error(err);
    res.json({ error: err.message || err });
  }
};
