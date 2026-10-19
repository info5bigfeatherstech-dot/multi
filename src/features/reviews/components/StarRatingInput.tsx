import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!',
};

export const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  size = 'md',
  disabled = false,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : value;

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div 
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;

          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverRating(star)}
              className={`p-1 rounded-lg transition-transform focus:outline-hidden disabled:cursor-not-allowed ${
                !disabled ? 'hover:scale-115 active:scale-95 cursor-pointer' : ''
              }`}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <Star
                className={`${starSizes[size]} transition-colors duration-150 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                    : 'text-slate-300 fill-transparent hover:text-amber-300'
                }`}
              />
            </button>
          );
        })}

        {activeRating > 0 && (
          <span className="text-xs font-bold text-amber-600 ml-2 animate-fadeIn">
            {RATING_LABELS[activeRating] || `${activeRating} Stars`}
          </span>
        )}
      </div>
    </div>
  );
};
