"use client";

import { motion } from "framer-motion";

function Star({ i }: { i: number }) {
  const size = 1 + Math.sin(i * 0.7) * 2;
  const x = ((i * 137 + 50) % 100);
  const y = ((i * 251 + 30) % 100);
  const duration = 2 + Math.sin(i * 0.5) * 3;
  const delay = i * 0.1;

  return (
    <motion.div
      className="absolute rounded-full bg-foreground/20"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function StarsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
      {Array.from({ length: 80 }, (_, i) => (
        <Star key={i} i={i} />
      ))}
    </div>
  );
}
