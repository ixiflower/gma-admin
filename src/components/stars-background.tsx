"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function StarsBackground() {
  const stars = useMemo(() => {
    const rng = seedRandom(42);
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: rng() * 100,
      y: rng() * 100,
      size: 1 + rng() * 2.5,
      opacity: 0.15 + rng() * 0.5,
      duration: 1.5 + rng() * 3,
      delay: rng() * 3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-foreground/30"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3] }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
