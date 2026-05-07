// components/ui/RatingStars.tsx
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  rating: number;
  reviews: number;
}

export const RatingStars = ({ rating, reviews }: RatingStarsProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <StarSolidIcon key={`full-${i}`} className="w-4 h-4 text-amber-400" />
        ))}
        {hasHalfStar && (
          <div className="relative w-4 h-4">
            <StarSolidIcon className="absolute w-4 h-4 text-amber-400 clip-half" />
            <StarIcon className="absolute w-4 h-4 text-gray-300" />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
      <span className="text-xs font-medium text-gray-500">({reviews} reviews)</span>
    </div>
  );
};