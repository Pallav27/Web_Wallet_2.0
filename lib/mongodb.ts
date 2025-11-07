import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connects to MongoDB using the MONGODB_URI env var and returns the database instance.
 * Caches connection in dev to avoid exhausting connections during HMR.
 */
export async function connectToDatabase(databaseName = "webwallet") {
  if (cachedDb) return { client: client!, db: cachedDb };

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
  }

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  const db = client.db(databaseName);
  cachedDb = db;

  return { client, db };
}

export type { Db };
