export interface Game {
    _id: {
        $oid: string;
    };
    title: string;
    items: Item[];
}

export interface Match {
    _id: {
        $oid: string;
    };
    matchDate: Date;
    itemOne: Item;
    itemTwo: Item;
    winner: number;
    itemOneOldElo: number;
    itemTwoOldElo: number;
    itemOneNewElo: number;
    itemTwoNewElo: number;
}

export interface Item {
    _id: {
        $oid: string;
    };
    title: string;
    url: string;
    matchCount: number;
    elo: number;
}
