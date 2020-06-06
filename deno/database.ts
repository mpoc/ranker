import { MongoClient } from "https://deno.land/x/mongo/mod.ts";
import "https://deno.land/x/dotenv/load.ts";

const dbUrl = Deno.env.get("DB_URL") || "mongodb://localhost:27017";
const dbName = Deno.env.get("DB_NAME") || "ranker";

const client = new MongoClient();
client.connectWithUri(dbUrl);

const db = client.database(dbName);

export default db;
