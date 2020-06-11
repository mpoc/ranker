import express from "express";
import mongoose from "mongoose";
import {
    addGame,
    getGame,
    playMatch,
    getNewMatch,
    vote,
    viewRatings
} from "./controller";
import { handleError, ErrorHandler } from "./error";
import { logger, httpLogger } from "./utils";

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(httpLogger);
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

const port = "8000";

// Vote
app.get("/vote/:gameId", vote);

// View ratings
app.get("/ratings/:gameId", viewRatings);

// Add a game with items
app.post("/api/games", addGame);

// Get items for a game sorted by elo
app.get("/api/games", getGame);

// Get two items in a game with the lowest amount of matches for a new match
app.get("/api/matches/new", getNewMatch);

// Add a match
app.post("/api/matches", playMatch);

app.use((err, req, res, next) => {
    if (!(err instanceof ErrorHandler)) logger.error(err);
    handleError(err, res);
});

app.listen(port, async (err: Error) => {
    if (err) return logger.error(err);
    mongoose.connect("mongodb://192.168.99.100:27017/ranker", { useNewUrlParser: true, useUnifiedTopology: true });
    logger.info(`Server is listening on port ${port}`);
    logger.info("Connected to MongoDB");
});
