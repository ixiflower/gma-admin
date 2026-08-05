import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme-context";
import { InlineScript } from "@/components/inline-script";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "GMA Admin",
  description: "Admin panel built with Next.js, Tailwind, Drizzle, shadcn/ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <InlineScript
          html={`try{var d=document.documentElement;var t=localStorage.getItem('theme')||'system';var c=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light';d.classList.add(c);d.style.colorScheme=c}catch(e){}`}
        />
      </head>
      <body className="h-full" suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
