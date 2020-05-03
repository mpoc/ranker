import dotenv from "dotenv";
import express from "express";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { rootHandler, helloHandler, addGameHandler } from "./handlers";
import path from "path";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const port = process.env.SERVER_PORT || "8000";

app.get("/", rootHandler);
app.get("/hello/:name", helloHandler);
app.post("/api/add", addGameHandler);

app.listen(port, async (err: Error) => {
  if (err) return console.error(err);
  console.log(`Server is listening on ${port}`);
  
  try {
    await createConnection({
      type: "postgres",
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      entities: [path.join(__dirname, "/entity/*.{ts,js}")],
      synchronize: true
    });
    console.log("Successfully connected to database");
  } catch (e) {
    console.log(e);
  }
});
