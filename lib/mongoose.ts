import mongoose from "mongoose";

declare global {
  // allow global mongoose cache in dev to avoid model overwrite/hang
  // eslint-disable-next-line no-var
  var _mongoose: { conn?: typeof mongoose | null; promise?: Promise<typeof mongoose> | null } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  // Don't throw here — let connection attempts fail in server runtime with helpful error.
  console.warn("MONGODB_URI not set. Set it in .env.local to connect to a database.");
}

export async function mongooseConnect() {
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
  }

  if (global._mongoose && global._mongoose.conn) {
    return global._mongoose.conn;
  }

  if (!global._mongoose) global._mongoose = { conn: null, promise: null };

  if (!global._mongoose.promise) {
    const opts = {
      // recommended options
      bufferCommands: false,
      // use the new parser and topology
      // (modern drivers ignore these flags but keeping for compatibility)
    } as mongoose.ConnectOptions;

    global._mongoose.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  global._mongoose.conn = await global._mongoose.promise;
  return global._mongoose.conn;
}

export default mongoose;
