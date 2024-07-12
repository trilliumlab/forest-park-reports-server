// @deno-types="@types/pg"
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../database/schema.ts";
import { config } from "../config.ts";

const pool = new pg.Pool({
  ...config.database,
  max: config.database.maxConnections,
});

export const db = drizzle(pool, { schema });
