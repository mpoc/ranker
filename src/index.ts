// import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
// import "reflect-metadata";
// import { createConnection } from "typeorm";
import {
    addGame
//   playMatchHandler,
//   getGameHandler,
//   itemsForNewMatchHandler
} from "./controller";

// import path from "path";

// dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// const port = process.env.SERVER_PORT || "8000";
const port = "8000";

// Add a game with items
app.post("/api/games", addGame);

// Get items for a game sorted by elo
// app.get("/api/game/:gameId", getGame);

// Get two items in a game with the lowest amount of matches for a new match
// app.get("/api/game/:gameId/items-for-new-match", itemsForNewMatch);

// Add a match
// app.post("/api/match/play", playMatch);

app.listen(port, async (err: Error) => {
    if (err) return console.error(err);
    mongoose.connect("mongodb://192.168.99.100:27017/ranker", { useNewUrlParser: true });
    console.log(`Server is listening on ${port}`);
});
