import React from 'react';

export const Toran: React.FC = () => {
  return (
    <div
      className="w-full h-8 sm:h-10 overflow-hidden relative pointer-events-none select-none z-20"
      aria-hidden="true"
    >
      {/* Decorative repeating SVG garland string */}
      <svg
        className="w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1200 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="marigoldOrange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFA000" />
            <stop offset="50%" stopColor="#FF6F00" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="marigoldYellow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF176" />
            <stop offset="50%" stopColor="#FFD54F" />
            <stop offset="100%" stopColor="#FFA000" />
          </linearGradient>
          <linearGradient id="mangoLeaf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#66BB6A" />
            <stop offset="60%" stopColor="#2E7D32" />
            <stop offset="100%" stopColor="#1B5E20" />
          </linearGradient>
          <linearGradient id="goldThread" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#FFF3B0" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>

        {/* Top Gold Connecting Rope */}
        <line x1="0" y1="3" x2="1200" y2="3" stroke="url(#goldThread)" strokeWidth="2.5" />

        {/* Repeating scalloped swags with mango leaves & marigold flowers */}
        {Array.from({ length: 15 }).map((_, i) => {
          const cx = i * 80 + 40;
          return (
            <g key={i}>
              {/* Scalloped Gold Swag */}
              <path
                d={`M ${cx - 40} 3 Q ${cx} 22 ${cx + 40} 3`}
                stroke="url(#goldThread)"
                strokeWidth="1.2"
                fill="none"
              />

              {/* Mango Leaf Drop */}
              <path
                d={`M ${cx} 3 C ${cx - 6} 12, ${cx - 6} 22, ${cx} 28 C ${cx + 6} 22, ${cx + 6} 12, ${cx} 3 Z`}
                fill="url(#mangoLeaf)"
              />

              {/* Center Orange Marigold Flower */}
              <circle cx={cx} cy={28} r={5} fill="url(#marigoldOrange)" />
              <circle cx={cx} cy={28} r={3} fill="url(#marigoldYellow)" />

              {/* Flanking Yellow Marigolds */}
              <circle cx={cx - 14} cy={16} r={3.5} fill="url(#marigoldYellow)" />
              <circle cx={cx + 14} cy={16} r={3.5} fill="url(#marigoldYellow)" />

              {/* Gold hanging bead tassel */}
              <circle cx={cx} cy={35} r={1.5} fill="#D4AF37" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

