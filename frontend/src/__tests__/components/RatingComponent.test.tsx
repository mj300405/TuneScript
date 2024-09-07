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
    expect(screen.getByPlaceholderText('Add a comment (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Rating' })).toBeDisabled();
    expect(screen.getByText('Average rating: 4.5 (10 ratings)')).toBeInTheDocument();
  });

  it('enables submit button when a rating is selected', () => {
    render(<RatingComponent {...mockProps} />);
    
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[2]); // Select 3 stars

    expect(screen.getByRole('button', { name: 'Submit Rating' })).toBeEnabled();
  });

  it('allows user to enter a comment', () => {
    render(<RatingComponent {...mockProps} />);
    
    const commentInput = screen.getByPlaceholderText('Add a comment (optional)');
    fireEvent.change(commentInput, { target: { value: 'Great transcription!' } });

    expect(commentInput).toHaveValue('Great transcription!');
  });

  it('calls mutation when submitting a rating', async () => {
    const mockMutate = jest.fn().mockResolvedValue({
      data: {
        rateTranscription: {
          rating: { id: '1', rating: 4, comment: 'Great!' },
          transcription: { id: '123', avgRating: 4.6, numRatings: 11 },
        },
      },
    });

    (useMutation as jest.Mock).mockReturnValue([mockMutate, { loading: false }]);

    render(<RatingComponent {...mockProps} />);
    
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[3]); // Select 4 stars
    
    const commentInput = screen.getByPlaceholderText('Add a comment (optional)');
    fireEvent.change(commentInput, { target: { value: 'Great!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Rating' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        variables: { transcriptionId: '123', ratingValue: 4, comment: 'Great!' },
      });
    });
  });

  it('displays "Update Rating" when initialRating is provided', () => {
    render(<RatingComponent {...mockProps} initialRating={3} />);
    
    expect(screen.getByRole('button', { name: 'Update Rating' })).toBeInTheDocument();
  });

  it('calls onRatingChange prop when rating is submitted', async () => {
    const mockOnRatingChange = jest.fn();
    const mockMutate = jest.fn().mockResolvedValue({
      data: {
        rateTranscription: {
          rating: { id: '1', rating: 5, comment: 'Excellent!' },
          transcription: { id: '123', avgRating: 4.7, numRatings: 11 },
        },
      },
    });

    (useMutation as jest.Mock).mockReturnValue([mockMutate, { loading: false }]);

    render(<RatingComponent {...mockProps} onRatingChange={mockOnRatingChange} />);
    
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[4]); // Select 5 stars
    
    const commentInput = screen.getByPlaceholderText('Add a comment (optional)');
    fireEvent.change(commentInput, { target: { value: 'Excellent!' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Rating' }));

    await waitFor(() => {
      expect(mockOnRatingChange).toHaveBeenCalledWith(5, 'Excellent!');
    });
  });

  it('handles error when rating submission fails', async () => {
    const mockMutate = jest.fn().mockRejectedValue(new Error('Submission failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (useMutation as jest.Mock).mockReturnValue([mockMutate, { loading: false }]);

    render(<RatingComponent {...mockProps} />);
    
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[2]); // Select 3 stars

    fireEvent.click(screen.getByRole('button', { name: 'Submit Rating' }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error rating transcription:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});