import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getGoogleUser } from "@/lib/google-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    const googleUser = await getGoogleUser(code);

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))
      .limit(1);

    let userId: number;

    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          name: googleUser.name,
          email: googleUser.email,
          password: "",
          role: "member",
        })
        .returning();
      userId = newUser.id;
    }

    const jar = await cookies();
    jar.set("gma_session", String(userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("Google auth error:", err);
    return NextResponse.redirect(new URL("/login?error=google_auth", request.url));
  }
}
