import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* soft brand-colored glow behind the number */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(560px 400px at 50% 32%, color-mix(in oklab, var(--sidebar-primary) 16%, transparent), transparent 72%)",
        }}
      />

      {/* top kicker */}
      <div className="flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.35em] text-sidebar-primary">
        <span className="size-1.5 animate-pulse rounded-full bg-sidebar-primary" />
        gma admin
        <span className="text-muted-foreground/60">· error 404</span>
      </div>

      {/* giant outline number */}
      <div
        className="mt-8 select-none font-mono font-bold leading-none tracking-tight"
        style={{
          fontSize: "clamp(7rem, 24vw, 12rem)",
          WebkitTextStroke: "2px var(--sidebar-primary)",
          color: "transparent",
          textShadow: "0 0 44px color-mix(in oklab, var(--sidebar-primary) 55%, transparent)",
        }}
      >
        404
      </div>

      <h1 className="mt-10 text-center text-2xl font-semibold sm:text-3xl">
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-center text-sm text-muted-foreground sm:text-base">
        The page you&rsquo;re looking for doesn&rsquo;t exist, was moved, or you
        mistyped the address. Let&rsquo;s get you back somewhere useful.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "default", size: "lg" }))}
        >
          Back to home
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Sign in to GMA
        </Link>
      </div>

      <p className="mt-12 font-mono text-xs tracking-widest text-muted-foreground/50">
        ERR_NOT_FOUND · _0x404
      </p>
    </main>
  );
}