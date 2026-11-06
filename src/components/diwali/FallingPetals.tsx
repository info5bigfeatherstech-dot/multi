import React, { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

export const FallingPetals: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Subtle 7 petals drifting across hero using pure GPU compositor animations
  const petals = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      id: i,
      left: `${(i * 14 + 5)}%`,
      delay: `${i * 1.8}s`,
      duration: `${8 + (i % 3) * 2}s`,
      drift: `${(i % 2 === 0 ? 30 : -30)}px`,
      rot: `${(i % 2 === 0 ? 180 : -180)}deg`,
      size: i % 2 === 0 ? 12 : 9,
      color: i % 2 === 0 ? '#FF8A00' : '#FFC107',
    }));
  }, []);

  if (shouldReduceMotion) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10 hidden sm:block"
      aria-hidden="true"
    >
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute diwali-petal-pure"
          style={{
            left: p.left,
            top: '-20px',
            ['--petal-delay' as any]: p.delay,
            ['--petal-dur' as any]: p.duration,
            ['--petal-drift' as any]: p.drift,
            ['--petal-rot' as any]: p.rot,
          }}
        >
          {/* SVG Marigold Petal Shape */}
          <svg
            width={p.size}
            height={p.size * 1.4}
            viewBox="0 0 20 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 0C4 8 0 16 0 20C0 24.4 4.5 28 10 28C15.5 28 20 24.4 20 20C20 16 16 8 10 0Z"
              fill={p.color}
              opacity="0.85"
            />
            <path
              d="M10 4C7 10 5 16 5 20C5 23 7.5 25 10 25C12.5 25 15 23 15 20C15 16 13 10 10 4Z"
              fill="#FFE082"
              opacity="0.4"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};
