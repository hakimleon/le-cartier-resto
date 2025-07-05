"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type StarRatingProps = {
  count?: number
  initialRating?: number
  onRatingChange?: (rating: number) => void
}

export function StarRating({ count = 5, initialRating = 0, onRatingChange }: StarRatingProps) {
  const [rating, setRating] = useState(initialRating)
  const [hover, setHover] = useState(0)

  const handleRating = (newRating: number) => {
    setRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {[...Array(count)].map((_, index) => {
        const ratingValue = index + 1
        return (
          <button
            type="button"
            key={ratingValue}
            className="focus:outline-none"
            onClick={() => handleRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={cn(
                "h-6 w-6 cursor-pointer transition-colors",
                ratingValue <= (hover || rating) ? "text-accent fill-accent" : "text-muted-foreground"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
