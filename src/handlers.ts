import { Request, Response } from "express";
import { getConnection } from "typeorm";
import { Item } from "./entity/Item";

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

interface AddRequest {
  items: {title: string, url: string}[];
}

export const addHandler = async (req: Request, res: Response) => {
  try {
    const body: AddRequest = req.body;
    await getConnection().getRepository(Item).insert(body.items);
    return res.json({ body });
  } catch (err) {
    console.error(err);
    res.json({ error: err.message || err });
  }
};
