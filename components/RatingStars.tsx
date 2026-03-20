"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  interactive = false,
  size = "md",
  onRatingChange,
  className,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const displayRating = interactive ? hoverRating || rating : rating;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        const isPartial =
          !isFilled && starValue - 0.5 <= displayRating && !interactive;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              "transition-transform",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
            onClick={() => interactive && onRatingChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : isPartial
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-transparent text-slate-600"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

interface RatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingDisplay({
  rating,
  reviewCount,
  size = "sm",
  className,
}: RatingDisplayProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <RatingStars rating={rating} size={size} />
      <span className="text-xs text-slate-400">
        {rating > 0 ? rating.toFixed(1) : "No ratings"}
        {reviewCount !== undefined && reviewCount > 0 && (
          <span className="ml-1">({reviewCount})</span>
        )}
      </span>
    </div>
  );
}
