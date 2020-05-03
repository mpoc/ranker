import { Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import { Game } from "./Game";

@Entity()
export class Item {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    url: string;

    @Column({ type: "float", default: 400 })
    elo: number;

    @ManyToOne(type => Game, game => game.items)
    game: Game;

    constructor(params?: { title: string; url: string }) {
        if (params) {
            this.title = params.title;
            this.url = params.url;
        }
    }
}
