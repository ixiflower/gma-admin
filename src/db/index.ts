import "server-only";

import * as dns from "node:dns";
import * as net from "node:net";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

// Neon's pooler host resolves to 3x IPv6 + 3x IPv4. This box has no IPv6
// route and some networks blackhole IPv6 (ETIMEDOUT). Force IPv4-first
// resolution so net.connect picks an IPv4 address for every connection.
dns.setDefaultResultOrder("ipv4first");
// Node's Happy Eyeballs (autoSelectFamily) kills each address attempt after
// 250ms. On slow links (connect ~600ms) every attempt dies -> AggregateError
// of N ETIMEDOUTs. Disable it: try addresses sequentially, let the OS/pg
// timeout decide.
net.setDefaultAutoSelectFamily(false);

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
