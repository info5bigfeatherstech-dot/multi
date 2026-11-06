import React from 'react';

export const FairyLights: React.FC = () => {
  const bulbs = [
    { color: '#FFD700', anim: 'diwali-fairy-light-1', glow: 'rgba(255, 215, 0, 0.7)' },
    { color: '#FF8A00', anim: 'diwali-fairy-light-2', glow: 'rgba(255, 138, 0, 0.7)' },
    { color: '#FFF8E7', anim: 'diwali-fairy-light-3', glow: 'rgba(255, 248, 231, 0.8)' },
    { color: '#FFC107', anim: 'diwali-fairy-light-4', glow: 'rgba(255, 193, 7, 0.7)' },
    { color: '#FF7043', anim: 'diwali-fairy-light-1', glow: 'rgba(255, 112, 67, 0.7)' },
    { color: '#FFE082', anim: 'diwali-fairy-light-3', glow: 'rgba(255, 224, 130, 0.7)' },
  ];

  return (
    <div
      className="w-full h-8 overflow-hidden relative pointer-events-none select-none z-20 -mb-2"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between w-full px-2 sm:px-6">
        {Array.from({ length: 24 }).map((_, i) => {
          const bulb = bulbs[i % bulbs.length];
          const dropHeight = (i % 3 === 0 ? 14 : i % 2 === 0 ? 10 : 7);

          return (
            <div key={i} className="flex flex-col items-center">
              {/* Wire Drop */}
              <div
                className="w-[1px] bg-gradient-to-b from-amber-700/60 to-amber-900/40"
                style={{ height: `${dropHeight}px` }}
              />
              {/* Socket Cap */}
              <div className="w-1.5 h-1 bg-amber-900 rounded-t-[1px]" />
              {/* Glowing Bulb */}
              <div
                className={`w-2 h-2.5 sm:w-2.5 sm:h-3 rounded-full ${bulb.anim}`}
                style={{
                  backgroundColor: bulb.color,
                  boxShadow: `0 0 8px ${bulb.glow}`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

