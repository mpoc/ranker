import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Item {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    url!: string;

    @Column({ default: 400 })
    elo!: number;

}
