import { Request, Response } from "express";
import { getConnection } from "typeorm";
import { Item } from "./entity/Item";
import { Game } from "./entity/Game";

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
