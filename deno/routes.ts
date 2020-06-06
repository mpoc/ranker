import { Router } from 'https://deno.land/x/oak/mod.ts';
import {
    addGame,
    // getGame,
    // getItemsForNewMatch,
    // playMatch,
    getVotePage
} from './controller.ts'

const router = new Router();

router.get("/vote", getVotePage)
      .post("/api/game/add", addGame)
    //   .get("/api/game/:gameId", getGame)
    //   .get("/api/game/:gameId/items-for-new-match", getItemsForNewMatch)
    //   .post("/api/match/play", playMatch);

export default router;
