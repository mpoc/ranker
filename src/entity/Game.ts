import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Item } from "./Item";

@Entity()
export class Game {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Item, item => item.game, {
        cascade: true
    })
    items: Item[];

    constructor(params?: { title: string; items: Item[] }) {
        if (params) {
            this.title = params.title;
            this.items = params.items;
        }
    }
}
