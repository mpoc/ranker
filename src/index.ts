import express from "express";
import mongoose from "mongoose";
import {
    addGame,
    autoAddGame,
    getGame,
    playMatch,
    getNewMatch,
    addItems,
    vote,
    viewRatings
} from "./controller";
import { handleError, ErrorHandler } from "./error";
import { logger, httpLogger } from "./utils";
import { INTERNAL_SERVER_ERROR } from "http-status-codes";

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(httpLogger);
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

const PORT = "8000";

// Vote
app.get("/vote/:gameId", vote);

// View ratings
app.get("/ratings/:gameId", viewRatings);

// Add a game with items
app.post("/api/games", addGame);

// Add an item to a game
app.get("/api/games/auto", autoAddGame);

// Get items for a game sorted by elo
app.get("/api/games", getGame);

// Get two items in a game with the lowest amount of matches for a new match
app.get("/api/matches/new", getNewMatch);

// Add a match
app.post("/api/matches", playMatch);

// Add an item to a game
app.patch("/api/items", addItems);

app.use((err, req, res, next) => {
    // If error was not thrown manually with ErrorHandler, send it as a response
    // If the error was not an expected error (not an ErrorHandler), log the
    // error and send Unknown error as a response
    if (!(err instanceof ErrorHandler)) {
        logger.error(err);
        handleError(new ErrorHandler(INTERNAL_SERVER_ERROR, "Unknown error"), res)
    } else {
        handleError(err, res);
    }
});

app.listen(PORT, async (err: Error) => {
    if (err) return logger.error(err);
    mongoose.connect("mongodb://192.168.99.100:27017/ranker", { useNewUrlParser: true, useUnifiedTopology: true });
    logger.info(`Server is listening on port ${PORT}`);
    logger.info("Connected to MongoDB");
});
