import React from 'react';

export const Lanterns: React.FC = () => {
  return (
    <div
      className="absolute top-0 inset-x-0 h-40 pointer-events-none select-none overflow-hidden z-20 hidden md:block"
      aria-hidden="true"
    >
      {/* Left Hanging Akash Kandil Lantern */}
      <div className="absolute top-0 left-6 lg:left-12 diwali-lantern-sway">
        <svg
          width="50"
          height="120"
          viewBox="0 0 60 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* Top Hanging Gold Cord */}
          <line x1="30" y1="0" x2="30" y2="25" stroke="#D4AF37" strokeWidth="1.5" />
          <circle cx="30" cy="25" r="2.5" fill="#FFE082" />

          {/* Upper Pyramid Cap */}
          <polygon points="30,28 10,50 50,50" fill="#7A0C1E" stroke="#D4AF37" strokeWidth="1.2" />

          {/* Central Prismatic Diamond Body */}
          <polygon points="10,50 30,75 50,50 30,28" fill="#FF8A00" opacity="0.9" />
          <polygon points="10,50 30,75 50,50" fill="#FFC107" opacity="0.8" />
          <polygon points="10,50 30,75 50,50 30,95" fill="#7A0C1E" stroke="#D4AF37" strokeWidth="1.2" />

          {/* Center Glow Mirror */}
          <circle cx="30" cy="62" r="6" fill="#FFF9C4" filter="drop-shadow(0 0 6px #FFD54F)" />

          {/* Bottom Fringe Tassels */}
          <line x1="20" y1="95" x2="16" y2="135" stroke="#FFC107" strokeWidth="1.5" strokeDasharray="4 2" />
          <line x1="25" y1="95" x2="23" y2="140" stroke="#FF8A00" strokeWidth="1.5" />
          <line x1="30" y1="95" x2="30" y2="145" stroke="#D4AF37" strokeWidth="2" />
          <line x1="35" y1="95" x2="37" y2="140" stroke="#FF8A00" strokeWidth="1.5" />
          <line x1="40" y1="95" x2="44" y2="135" stroke="#FFC107" strokeWidth="1.5" strokeDasharray="4 2" />
        </svg>
      </div>

      {/* Right Hanging Akash Kandil Lantern */}
      <div className="absolute top-0 right-6 lg:right-14 diwali-lantern-sway-delayed">
        <svg
          width="44"
          height="110"
          viewBox="0 0 60 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* Top Hanging Gold Cord */}
          <line x1="30" y1="0" x2="30" y2="30" stroke="#D4AF37" strokeWidth="1.5" />
          <circle cx="30" cy="30" r="2.5" fill="#FFE082" />

          {/* Upper Pyramid Cap */}
          <polygon points="30,33 10,55 50,55" fill="#1B0B2E" stroke="#D4AF37" strokeWidth="1.2" />

          {/* Central Prismatic Diamond Body */}
          <polygon points="10,55 30,80 50,55 30,33" fill="#D4AF37" opacity="0.95" />
          <polygon points="10,55 30,80 50,55 30,100" fill="#7A0C1E" stroke="#D4AF37" strokeWidth="1.2" />

          {/* Center Glow Mirror */}
          <circle cx="30" cy="68" r="5" fill="#FFF9C4" filter="drop-shadow(0 0 6px #FFD54F)" />

          {/* Bottom Fringe Tassels */}
          <line x1="22" y1="100" x2="18" y2="135" stroke="#FFC107" strokeWidth="1.5" strokeDasharray="4 2" />
          <line x1="26" y1="100" x2="25" y2="140" stroke="#D4AF37" strokeWidth="1.8" />
          <line x1="30" y1="100" x2="30" y2="145" stroke="#FF8A00" strokeWidth="2" />
          <line x1="34" y1="100" x2="35" y2="140" stroke="#D4AF37" strokeWidth="1.8" />
          <line x1="38" y1="100" x2="42" y2="135" stroke="#FFC107" strokeWidth="1.5" strokeDasharray="4 2" />
        </svg>
      </div>
    </div>
  );
};

