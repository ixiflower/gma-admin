"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, signup } from "@/lib/auth";
import { googleLogin } from "@/lib/google-login";
import { GoogleIcon, GitHubIcon } from "@/components/auth-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [loginState, loginAction, loginPending] = useActionState(login, {});
  const [signupState, signupAction, signupPending] = useActionState(signup, {});

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Welcome to GMA</h1>
        <p className="text-sm text-muted-foreground"> Sign up for a new account or sign in to continue</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Create an account</h2>
              <p className="text-xs text-muted-foreground">Join GMA and get started</p>
            </div>
            <form action={signupAction} className="flex flex-col gap-4">
              {signupState?.error && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {signupState.error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" type="text" placeholder="John Doe" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" name="password" type="password" placeholder="Min. 6 characters" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={signupPending}>
                {signupPending ? "Creating..." : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Sign in</h2>
              <p className="text-xs text-muted-foreground">Already have an account? Sign in</p>
            </div>
            <form action={loginAction} className="flex flex-col gap-4">
              {loginState?.error && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {loginState.error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" name="password" type="password" placeholder="Enter your password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loginPending}>
                {loginPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" className="flex-1" type="button" onClick={() => googleLogin()}>
          <GoogleIcon />
          Google
        </Button>
        <Button variant="outline" className="flex-1" type="button">
          <GitHubIcon />
          GitHub
        </Button>
      </div>
    </div>
  );
}
