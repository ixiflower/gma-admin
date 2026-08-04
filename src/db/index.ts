import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { gmaPool?: Pool };

const pool =
  globalForDb.gmaPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 5,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") globalForDb.gmaPool = pool;

export const db = drizzle(pool, { schema });
