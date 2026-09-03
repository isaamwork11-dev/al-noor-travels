import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Thrown when the app is running without a database configured. API routes turn
 * this into a 503 so the UI can show a setup hint instead of a generic crash.
 */
export class MissingMongoUriError extends Error {
  constructor() {
    super(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example) and restart the server."
    );
    this.name = "MissingMongoUriError";
  }
}

export function hasMongoUri(): boolean {
  return Boolean(MONGODB_URI);
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// The dev server re-evaluates modules on every hot reload; caching the
// connection on `globalThis` keeps us from opening a new pool each time.
const globalForMongoose = globalThis as typeof globalThis & {
  __alNoorMongoose?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose.__alNoorMongoose ?? { conn: null, promise: null };
globalForMongoose.__alNoorMongoose = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) throw new MissingMongoUriError();
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: process.env.MONGODB_DB || undefined,
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
