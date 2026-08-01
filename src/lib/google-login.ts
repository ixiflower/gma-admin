"use server";

import { redirect } from "next/navigation";
import { getGoogleAuthUrl } from "@/lib/google-auth";

export async function googleLogin() {
  redirect(getGoogleAuthUrl());
}
