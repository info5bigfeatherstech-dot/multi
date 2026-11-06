import React from 'react';

interface DiyaGlowProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  glow?: boolean;
}

export const DiyaGlow: React.FC<DiyaGlowProps> = ({
  size = 'md',
  className = '',
  glow = true,
}) => {
  const dimensions = {
    sm: { width: 24, height: 24 },
    md: { width: 34, height: 34 },
    lg: { width: 48, height: 48 },
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      aria-hidden="true"
    >
      {/* Soft Ambient Radial Glow */}
      {glow && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-t from-[#FF8A00]/40 to-[#FFC107]/60 blur-md pointer-events-none"
          style={{ width: dimensions.width * 1.3, height: dimensions.height * 1.3 }}
        />
      )}

      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 overflow-visible"
      >
        <defs>
          {/* Flame Gradient */}
          <linearGradient id="diyaFlameGrad" x1="32" y1="6" x2="32" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="35%" stopColor="#FFD54F" />
            <stop offset="70%" stopColor="#FF8A00" />
            <stop offset="100%" stopColor="#D84315" />
          </linearGradient>

          {/* Diya Clay Base Gradient */}
          <linearGradient id="diyaClayGrad" x1="10" y1="30" x2="54" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E67E22" />
            <stop offset="40%" stopColor="#C0392B" />
            <stop offset="85%" stopColor="#7A0C1E" />
            <stop offset="100%" stopColor="#4A0512" />
          </linearGradient>

          {/* Gold Rim Gradient */}
          <linearGradient id="diyaGoldRim" x1="8" y1="32" x2="56" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>
        </defs>

        {/* Flickering Animated Flame */}
        <g className="diwali-flame-animated origin-bottom">
          {/* Outer Flame Glow */}
          <path
            d="M32 6C32 6 38 16 38 23C38 28.5 35.3 31 32 31C28.7 31 26 28.5 26 23C26 16 32 6 32 6Z"
            fill="url(#diyaFlameGrad)"
          />
          {/* Inner Flame Core */}
          <path
            d="M32 14C32 14 35 19 35 23C35 26 33.5 28 32 28C30.5 28 29 26 29 23C29 19 32 14 32 14Z"
            fill="#FFFDE7"
          />
        </g>

        {/* Diya Clay Body */}
        <path
          d="M8 34C11 44 20 52 32 52C44 52 53 44 56 34C48 37 40 38 32 38C24 38 16 37 8 34Z"
          fill="url(#diyaClayGrad)"
          stroke="url(#diyaGoldRim)"
          strokeWidth="1.5"
        />

        {/* Decorative Golden Rim & Rim Pattern */}
        <ellipse cx="32" cy="34" rx="24" ry="4" fill="none" stroke="url(#diyaGoldRim)" strokeWidth="1.2" />
        <circle cx="24" cy="40" r="1.5" fill="#FFE082" />
        <circle cx="32" cy="42" r="1.8" fill="#FFE082" />
        <circle cx="40" cy="40" r="1.5" fill="#FFE082" />

        {/* Diya Base Stand */}
        <path
          d="M26 52L24 56H40L38 52H26Z"
          fill="#5B0816"
          stroke="#D4AF37"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};

