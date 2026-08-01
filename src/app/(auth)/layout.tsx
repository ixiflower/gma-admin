"use client";

import Autoplay from "embla-carousel-autoplay";
import * as React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const slides = [
  {
    title: "Powerful Admin Panel",
    text: "Manage your entire workflow from one place. Built with Next.js, Tailwind, and Drizzle ORM.",
  },
  {
    title: "Real-time Chat",
    text: "Message your team instantly. Add reactions, search conversations, and stay connected.",
  },
  {
    title: "Beautiful UI",
    text: "Crafted with shadcn/ui components. Dark mode, collapsible sidebar, and responsive design.",
  },
  {
    title: "Cloud Infrastructure",
    text: "PostgreSQL on Neon, media on Cloudinary, and deployed on Vercel. Built for scale.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="flex min-h-svh">
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:px-8">
        {children}
      </div>

      <div className="relative hidden flex-1 bg-gradient-to-br from-primary via-primary/90 to-primary/70 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

        <div className="relative flex flex-1 flex-col items-center justify-center px-12">
          <Carousel
            setApi={setApi}
            plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
            className="w-full max-w-md"
          >
            <CarouselContent>
              {slides.map((slide) => (
                <CarouselItem key={slide.title}>
                  <div className="flex flex-col items-center gap-4 text-center text-primary-foreground">
                    <h2 className="text-3xl font-bold tracking-tight">
                      {slide.title}
                    </h2>
                    <p className="text-lg leading-relaxed text-primary-foreground/80">
                      {slide.text}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="mt-12 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current
                    ? "w-8 bg-primary-foreground"
                    : "w-1.5 bg-primary-foreground/40 hover:bg-primary-foreground/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
