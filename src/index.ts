import express from "express";
import mongoose from "mongoose";
import {
    addGame,
    getGame,
    playMatch,
    getNewMatch
} from "./controller";
import { handleError, ErrorHandler } from "./error";

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const port = "8000";

// Add a game with items
app.post("/api/games", addGame);

// Get items for a game sorted by elo
app.get("/api/games", getGame);

// Get two items in a game with the lowest amount of matches for a new match
app.get("/api/matches/new", getNewMatch);

// Add a match
app.post("/api/matches", playMatch);

app.use((err, req, res, next) => {
    handleError(err, res);
});

app.listen(port, async (err: Error) => {
    if (err) return console.error(err);
    mongoose.connect("mongodb://192.168.99.100:27017/ranker", { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`Server is listening on ${port}`);
});
