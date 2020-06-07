// import Schema, { Type, string, number, array } from 'https://github.com/mpoc/computed-types/raw/master/src/index.ts';
// import Schema, { Type, string, number, array } from 'https://deno.land/x/computed_types/src/index.ts';

// export const AddGameRequestSchema = Schema({
//     title: string,
//     items: array.of({
//         title: string,
//         url: string
//     })
// });

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
    title: string;
    url: string;
    matchCount: number;
    elo: number;
}
