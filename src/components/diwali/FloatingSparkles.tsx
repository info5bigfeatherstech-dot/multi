import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const FloatingSparkles: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Low particle count for excellent performance (12 particles)
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: `${(i * 8.3 + 4).toFixed(1)}%`,
      size: i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2,
      delay: (i * 0.45) % 4,
      duration: 5 + (i % 4) * 1.5,
      opacity: 0.35 + (i % 3) * 0.2,
    }));
  }, []);

  if (shouldReduceMotion) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-t from-[#FF8A00] to-[#FFE082]"
          style={{
            left: p.x,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: '0 0 6px rgba(255, 215, 0, 0.8)',
          }}
          animate={{
            y: ['0vh', '-65vh'],
            x: [0, (p.id % 2 === 0 ? 15 : -15), 0],
            opacity: [0, p.opacity, p.opacity, 0],
            scale: [0.6, 1.2, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

