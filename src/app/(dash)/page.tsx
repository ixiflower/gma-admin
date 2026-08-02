"use client";

import { useTheme } from "next-themes";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";

export default function Home() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden -mx-4">
      <StarsBackground
        className="absolute inset-0 dark:bg-[radial-gradient(ellipse_at_bottom,_#262626_0%,_#000_100%)] bg-[radial-gradient(ellipse_at_bottom,_#f5f5f5_0%,_#fff_100%)]"
        starColor={resolvedTheme === "light" ? "#000" : "#fff"}
      />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to GMA</h1>
        <p className="text-sm text-muted-foreground">Your admin panel is ready</p>
      </div>
    </div>
  );
}
