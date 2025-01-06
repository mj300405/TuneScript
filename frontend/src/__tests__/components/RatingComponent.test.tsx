import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RatingComponent, { RATE_TRANSCRIPTION } from '../../components/RatingComponent';
import { useMutation } from '@apollo/client';

jest.mock('@apollo/client');

describe('RatingComponent', () => {
  const mockProps = {
    transcriptionId: '123',
    averageRating: 4.5,
    numRatings: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial props', () => {
    render(<RatingComponent {...mockProps} />);
    
    expect(screen.getByText('Your rating:')).toBeInTheDocument();
    expect(screen.getByText('Average rating: 4.5 (10 ratings)')).toBeInTheDocument();
  });

  it('calls mutation when selecting a rating', async () => {
    const mockMutate = jest.fn().mockResolvedValue({
      data: {
        rateTranscription: {
          rating: { id: '1', rating: 4 },
          transcription: { id: '123', avgRating: 4.6, numRatings: 11 },
        },
      },
    });

    (useMutation as jest.Mock).mockReturnValue([mockMutate, { loading: false }]);

    render(<RatingComponent {...mockProps} />);
    
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[3]); // Select 4 stars

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        variables: { transcriptionId: '123', ratingValue: 4 },
      });
    });
  });

  it('calls onRatingChange prop when rating is submitted', async () => {
    const mockOnRatingChange = jest.fn();
    const mockMutate = jest.fn().mockResolvedValue({
      data: {
        rateTranscription: {
          rating: { id: '1', rating: 5 },
          transcription: { id: '123', avgRating: 4.7, numRatings: 11 },
        },
      },
    });

    (useMutation as jest.Mock).mockReturnValue([mockMutate, { loading: false }]);

    render(<RatingComponent {...mockProps} onRatingChange={mockOnRatingChange} />);
    
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[4]); // Select 5 stars

    await waitFor(() => {
      expect(mockOnRatingChange).toHaveBeenCalledWith(5);
    });
  });

  it('handles error when rating submission fails', async () => {
    const mockMutate = jest.fn().mockRejectedValue(new Error('Submission failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (useMutation as jest.Mock).mockReturnValue([mockMutate, { loading: false }]);

    render(<RatingComponent {...mockProps} />);
    
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[2]); // Select 3 stars

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error rating transcription:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});