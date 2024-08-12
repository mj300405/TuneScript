import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

export const RATE_TRANSCRIPTION = gql`
  mutation RateTranscription($transcriptionId: ID!, $ratingValue: Int!, $comment: String) {
    rateTranscription(transcriptionId: $transcriptionId, ratingValue: $ratingValue, comment: $comment) {
      rating {
        id
        rating
        comment
        user {
          username
        }
        createdAt
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
  initialComment?: string | null;
  averageRating: number;
  numRatings: number;
  onRatingChange?: (newRating: number, newComment: string | null) => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({ 
  transcriptionId, 
  initialRating = null,
  initialComment = null,
  averageRating,
  numRatings,
  onRatingChange 
}) => {
  const [userRating, setUserRating] = useState<number | null>(initialRating);
  const [comment, setComment] = useState<string | null>(initialComment);
  const [rateTranscription, { error }] = useMutation(RATE_TRANSCRIPTION);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleRating = async (newRating: number) => {
    try {
      const { data } = await rateTranscription({
        variables: { 
          transcriptionId, 
          ratingValue: newRating, 
          comment 
        },
      });
      if (data && data.rateTranscription) {
        setUserRating(newRating);
        setSubmissionError(null);
        if (onRatingChange) {
          onRatingChange(newRating, comment);
        }
      }
    } catch (error) {
      console.error('Error rating transcription:', error);
      setSubmissionError('There was an error submitting your rating. Please try again.');
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
        <span id="rating-label" className="mr-2">Your rating:</span>
        <div role="radiogroup" aria-labelledby="rating-label">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setUserRating(star)}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              aria-checked={star === userRating}
              role="radio"
              className={`text-2xl ${star <= (userRating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2">
        <textarea
          value={comment || ''}
          onChange={handleCommentChange}
          placeholder="Add a comment (optional)"
          className="w-full p-2 border rounded"
          rows={3}
          aria-label="Rating comment"
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
      {submissionError && <div className="text-red-500 mt-2" role="alert">{submissionError}</div>}
    </div>
  );
};

export default RatingComponent;