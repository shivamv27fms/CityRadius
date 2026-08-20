import { Star } from "lucide-react";

export function RatingStars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="rating-stars" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={size}
          fill={index + 0.5 <= value ? "currentColor" : "none"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
