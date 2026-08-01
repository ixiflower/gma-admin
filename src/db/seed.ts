import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

import * as schema from "@/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  const existing = await db.select().from(schema.users).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  const hash = await bcrypt.hash("password123", 10);

  const [admin, member] = await db
    .insert(schema.users)
    .values([
      {
        name: "Alice Admin",
        email: "alice@example.com",
        password: hash,
        role: "admin",
      },
      {
        name: "Bob Member",
        email: "bob@example.com",
        password: hash,
        role: "member",
      },
    ])
    .returning();

  await db.insert(schema.posts).values([
    {
      userId: admin.id,
      title: "Welcome to GMA",
      body: "A clean Next.js + Drizzle starter with server actions.",
      published: 1,
    },
    {
      userId: member.id,
      title: "Draft post",
      body: "This post is not published yet.",
      published: 0,
    },
  ]);

  console.log("Seeded users (password: password123) and posts.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
