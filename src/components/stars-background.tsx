"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const radius = 0.1 + (i * 0.7) % 0.9;
    return {
      id: i,
      x: 50 + Math.cos(angle) * radius * 50,
      y: 50 + Math.sin(angle) * radius * 50,
      size: 0.8 + (i % 4) * 0.5,
      duration: 2 + (i % 6) * 1.1,
      delay: i * 0.04,
      opacity: 0.15 + (i % 7) * 0.07,
    };
  });
}

export function StarsBackground() {
  const stars = useMemo(() => generateStars(130), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-foreground"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 3.5, star.opacity],
          }}
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
