import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Item } from "./Item";

@Entity()
export class Match {

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    matchDate: Date;

    @ManyToOne(type => Item)
    itemOne: Item;

    @ManyToOne(type => Item)
    itemTwo: Item;

    @Column()
    winner: number;

    @Column({ type: "float"})
    itemOneOldElo: number;

    @Column({ type: "float"})
    itemTwoOldElo: number;

    @Column({ type: "float"})
    itemOneNewElo: number;

    @Column({ type: "float"})
    itemTwoNewElo: number;

    constructor(params?: {
        itemOne: Item;
        itemTwo: Item;
        itemOneOldElo: number;
        itemTwoOldElo: number;
        itemOneNewElo: number;
        itemTwoNewElo: number;
        winner: number;
    }) {
        if (params) {
            this.itemOne = params.itemOne;
            this.itemTwo = params.itemTwo;
            this.itemOneOldElo = params.itemOneOldElo;
            this.itemTwoOldElo = params.itemTwoOldElo;
            this.itemOneNewElo = params.itemOneNewElo;
            this.itemTwoNewElo = params.itemTwoNewElo;
            this.winner = params.winner;
        }
    }
}
