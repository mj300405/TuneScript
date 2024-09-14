import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

export const RATE_TRANSCRIPTION = gql`
  mutation RateTranscription($transcriptionId: ID!, $ratingValue: Int!) {
    rateTranscription(transcriptionId: $transcriptionId, ratingValue: $ratingValue) {
      rating {
        id
        rating
      }
      transcription {
        id
        avgRating
        numRatings
      }
    }
  }
`;

interface RatingComponentProps {
  transcriptionId: string;
  initialRating?: number | null;
  averageRating: number;
  numRatings: number;
  onRatingChange?: (newRating: number) => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  transcriptionId,
  initialRating = null,
  averageRating,
  numRatings,
  onRatingChange
}) => {
  const [userRating, setUserRating] = useState<number | null>(initialRating);
  const [rateTranscription] = useMutation(RATE_TRANSCRIPTION);

  const handleRating = async (newRating: number) => {
    try {
      const { data } = await rateTranscription({
        variables: { transcriptionId, ratingValue: newRating },
      });
      setUserRating(newRating);
      if (onRatingChange) {
        onRatingChange(newRating);
      }
    } catch (error) {
      console.error('Error rating transcription:', error);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center">
        <span className="mr-2">Your rating:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            className={`text-2xl ${star <= (userRating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="mt-1">
        Average rating: {averageRating.toFixed(1)} ({numRatings} {numRatings === 1 ? 'rating' : 'ratings'})
      </div>
    </div>
  );
};

export default RatingComponent;