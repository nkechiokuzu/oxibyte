import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Neon (and most hosted Postgres) periodically closes idle connections in
// the background. Without a listener here, that shows up as an unhandled
// 'error' event on the pool and crashes the entire Node process — not just
// the request that happened to be using the connection. Logging it instead
// lets the pool quietly open a replacement connection on the next query.
pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client:", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
