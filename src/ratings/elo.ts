export class EloPlayer {
    rating: number;

    constructor(rating: number, kValue?: number) {
        this.rating = rating || 1000;
    }

    getWinningProbabilityAgainst(otherPlayer: EloPlayer): number {
        return (1.0 / (1.0 + Math.pow(10, ((otherPlayer.rating - this.rating) / 400.0))));
    }

    wonAgainst(opponent: EloPlayer) {
        const eloMatch = new EloMatch();
        eloMatch.updateRatingsWithScore([this, opponent], [1, 0]);
    }
    
    lostAgainst(opponent: EloPlayer) {
        const eloMatch = new EloMatch();
        eloMatch.updateRatingsWithScore([this, opponent], [0, 1]);
    }
}

export class EloMatch {
    kValue: number;

    constructor(kValue?: number) {
        this.kValue = kValue || 32;
    }

    updateRatingsWithScore([player1, player2]: EloPlayer[], [score1, score2]: number[]) {
        player1.rating = player1.rating + this.kValue * (score1 - player1.getWinningProbabilityAgainst(player2));;
        player2.rating = player2.rating + this.kValue * (score2 - player2.getWinningProbabilityAgainst(player1));;
    }

    updateRatings(players: EloPlayer[], winners: boolean[]) {
        const scores = winners.map(won => won ? 1 : 0);
        this.updateRatingsWithScore(players, scores);
    }
}
