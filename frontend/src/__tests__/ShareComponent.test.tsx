import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareComponent from '../components/ShareComponent';
import { useMutation } from '@apollo/client';

jest.mock('@apollo/client');
jest.mock('lucide-react', () => ({
  Share2: () => <div data-testid="share-icon">Share Icon</div>,
  Check: () => <div data-testid="check-icon">Check Icon</div>,
}));

describe('ShareComponent', () => {
  const mockProps = {
    transcriptionId: '123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls mutation and updates UI when share button is clicked', async () => {
    const mockShareUrl = 'http://example.com/share/123';
    const mockMutate = jest.fn().mockResolvedValue({
      data: {
        shareTranscription: {
          shareUrl: mockShareUrl,
        },
      },
    });

    (useMutation as jest.Mock).mockReturnValue([mockMutate, { loading: false }]);

    render(<ShareComponent {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        variables: { transcriptionId: '123' },
      });
    });

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockShareUrl);
    });

    // Wait for the UI to update
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Link Copied!');
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    // Fast-forward time to test the reset
    jest.advanceTimersByTime(3000);

    // Wait for the UI to reset
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Share');
      expect(screen.getByTestId('share-icon')).toBeInTheDocument();
    });
  });

  it('handles error when sharing fails', async () => {
    const mockMutate = jest.fn().mockRejectedValue(new Error('Sharing failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    (useMutation as jest.Mock).mockReturnValue([mockMutate, { loading: false }]);

    render(<ShareComponent {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error sharing transcription:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Failed to share transcription. Please try again.');
    });

    expect(screen.getByRole('button')).toHaveAttribute('title', 'Share');
    expect(screen.getByTestId('share-icon')).toBeInTheDocument();

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});