import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

export const RATE_TRANSCRIPTION = gql`
  mutation RateTranscription($transcriptionId: ID!, $ratingValue: Int!, $comment: String) {
    rateTranscription(transcriptionId: $transcriptionId, ratingValue: $ratingValue, comment: $comment) {
      rating {
        id
        rating
        comment
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
  onRatingChange?: (newRating: number, newComment: string | null) => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  transcriptionId,
  initialRating = null,
  averageRating,
  numRatings,
  onRatingChange
}) => {
  const [userRating, setUserRating] = useState<number | null>(initialRating);
  const [comment, setComment] = useState<string>('');
  const [rateTranscription] = useMutation(RATE_TRANSCRIPTION);

  const handleRating = async (newRating: number) => {
    try {
      const { data } = await rateTranscription({
        variables: { transcriptionId, ratingValue: newRating, comment },
      });
      setUserRating(newRating);
      if (onRatingChange) {
        onRatingChange(newRating, comment);
      }
    } catch (error) {
      console.error('Error rating transcription:', error);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleSubmit = () => {
    if (userRating !== null) {
      handleRating(userRating);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center">
        <span className="mr-2">Your rating:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setUserRating(star)}
            className={`text-2xl ${star <= (userRating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="mt-2">
        <textarea
          value={comment}
          onChange={handleCommentChange}
          placeholder="Add a comment (optional)"
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>
      <button 
        onClick={handleSubmit}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={userRating === null}
      >
        {userRating === initialRating ? 'Update Rating' : 'Submit Rating'}
      </button>
      <div className="mt-1">
        Average rating: {averageRating.toFixed(1)} ({numRatings} {numRatings === 1 ? 'rating' : 'ratings'})
      </div>
    </div>
  );
};

export default RatingComponent;