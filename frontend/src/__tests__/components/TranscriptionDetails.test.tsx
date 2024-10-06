import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TranscriptionDetails, { ADD_TO_FAVORITES, REMOVE_FROM_FAVORITES } from '../../components/TranscriptionDetails';
import * as apolloClient from '@apollo/client';

// Mock RatingComponent
jest.mock('../../components/RatingComponent', () => {
  return function MockRatingComponent({ onRatingChange }: { onRatingChange: (rating: number) => void }) {
    return (
      <div data-testid="rating-component" onClick={() => onRatingChange(5)}>
        Mock Rating Component
      </div>
    );
  };
});

// Mock ShareComponent
jest.mock('../../components/ShareComponent', () => () => <div data-testid="share-component">Mock Share Component</div>);

// Mock react-pdf
jest.mock('react-pdf', () => ({
  Document: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ pageNumber }: { pageNumber: number }) => <div data-testid="pdf-page">Mocked PDF Page: {pageNumber}</div>,
  pdfjs: { GlobalWorkerOptions: { workerSrc: 'mocked-worker-src' } },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FileMusic: () => <div data-testid="file-music-icon">FileMusic Icon</div>,
  FileText: () => <div data-testid="file-text-icon">FileText Icon</div>,
  Eye: () => <div data-testid="eye-icon">Eye Icon</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff Icon</div>,
  Play: () => <div data-testid="play-icon">Play Icon</div>,
  Pause: () => <div data-testid="pause-icon">Pause Icon</div>,
  Trash2: () => <div data-testid="trash2-icon">Trash2 Icon</div>,
  Star: () => <div data-testid="star-icon">Star Icon</div>,
}));

const mockTranscriptionData = {
  id: '123',
  title: 'Test Transcription',
  composer: 'Test Composer',
  player: 'Test Player',
  tags: [
    { id: '1', name: 'Jazz' },
    { id: '2', name: 'Piano' },
  ],
  visibility: 'public',
  status: 'COMPLETED',
  avgRating: 4.5,
  userRating: 4,
  numRatings: 10,
  createdAt: '2023-09-01T00:00:00Z',
  isOwner: true,
  isFavorited: false,
  midiFile: { downloadUrl: 'http://example.com/midi' },
  sheetMusic: { downloadUrl: 'http://example.com/pdf' },
  audioFile: { audioFile: 'test-audio.mp3' },
};

describe('TranscriptionDetails', () => {
  const mockOnClose = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).confirm = jest.fn(() => true);
  });

  it('renders loading state', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: true,
      error: undefined,
      data: undefined,
    } as any);

    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders transcription details', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { transcription: mockTranscriptionData },
    } as any);

    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);

    await waitFor(() => {
      expect(screen.getByText('Test Transcription')).toBeInTheDocument();
      expect(screen.getByText('Test Composer')).toBeInTheDocument();
      expect(screen.getByText('Test Player')).toBeInTheDocument();
      expect(screen.getByText('public')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('4.5 (10 ratings)')).toBeInTheDocument();
    });
  });

  it('renders RatingComponent and ShareComponent', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { transcription: mockTranscriptionData },
    } as any);

    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);

    await waitFor(() => {
      expect(screen.getByTestId('rating-component')).toBeInTheDocument();
      expect(screen.getByTestId('share-component')).toBeInTheDocument();
    });
  });

  it('toggles PDF preview', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { transcription: mockTranscriptionData },
    } as any);

    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);

    await waitFor(() => {
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('eye-icon'));

    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-page')).toBeInTheDocument();
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { transcription: mockTranscriptionData },
    } as any);

    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('✕'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onDelete when delete button is clicked and confirmed', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { transcription: mockTranscriptionData },
    } as any);
    
    jest.spyOn(apolloClient, 'useMutation').mockReturnValue([
      jest.fn().mockResolvedValue({ data: { deleteTranscription: { success: true } } }),
      { loading: false },
    ] as any);

    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);

    await waitFor(() => {
      expect(screen.getByTestId('trash2-icon')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('trash2-icon'));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this transcription?');

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('handles error state', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: new Error('Test error'),
      data: undefined,
    } as any);

    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);

    await waitFor(() => {
      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });
  });

  it('renders audio controls when audio file is available and loaded', async () => {
    const mockAudio = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      pause: jest.fn(),
      play: jest.fn().mockResolvedValue(undefined),
    };
    (global.Audio as jest.Mock) = jest.fn(() => mockAudio);

    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { transcription: mockTranscriptionData },
    } as any);
  
    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);
  
    await waitFor(() => {
      expect(screen.getByText('Test Transcription')).toBeInTheDocument();
    });
  
    act(() => {
      const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'loadeddata'
      )[1];
      loadedDataCallback();
    });
  
    await waitFor(() => {
      const audioButton = screen.queryByTitle('Play Preview');
      expect(audioButton).toBeInTheDocument();
      expect(audioButton?.querySelector('[data-testid="play-icon"]')).toBeInTheDocument();
    });
  });

  it('calls mutation when rating is changed', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { transcription: mockTranscriptionData },
    } as any);
    
    const mockRateMutation = jest.fn().mockResolvedValue({
      data: {
        rateTranscription: {
          rating: { id: '1', rating: 5 },
          transcription: { id: '123', avgRating: 4.6, numRatings: 11 },
        },
      },
    });

    jest.spyOn(apolloClient, 'useMutation').mockReturnValue([mockRateMutation, { loading: false }] as any);

    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);

    await waitFor(() => {
      expect(screen.getByTestId('rating-component')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('rating-component'));

    await waitFor(() => {
      expect(mockRateMutation).toHaveBeenCalledWith({
        variables: { transcriptionId: '123', ratingValue: 5 },
      });
    });
  });

  it('toggles favorite status in UI', async () => {
    let isFavorited = false;
  
    const mockUseQuery = jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { transcription: { ...mockTranscriptionData, isFavorited } },
      refetch: jest.fn().mockImplementation(() => {
        isFavorited = !isFavorited;
        return Promise.resolve({
          data: { transcription: { ...mockTranscriptionData, isFavorited } },
        });
      }),
    } as any);
  
    const mockAddToFavorites = jest.fn().mockResolvedValue({ data: { success: true } });
    const mockRemoveFromFavorites = jest.fn().mockResolvedValue({ data: { success: true } });
  
    jest.spyOn(apolloClient, 'useMutation').mockImplementation((mutation) => {
      if (mutation === ADD_TO_FAVORITES) {
        return [mockAddToFavorites, { loading: false }] as any;
      } else if (mutation === REMOVE_FROM_FAVORITES) {
        return [mockRemoveFromFavorites, { loading: false }] as any;
      } else {
        return [jest.fn(), { loading: false }] as any;
      }
    });
  
    render(<TranscriptionDetails transcriptionId="123" onClose={mockOnClose} onDelete={mockOnDelete} />);
  
    // Initial state: not favorited
    let starButton = await screen.findByTestId('star-icon');
    expect(starButton.closest('button')).toHaveAttribute('title', 'Add to Favorites');
  
    // Click to add to favorites
    fireEvent.click(starButton);
  
    // Wait for the UI to update
    await waitFor(() => {
      starButton = screen.getByTestId('star-icon');
      expect(starButton.closest('button')).toHaveAttribute('title', 'Remove from Favorites');
    });
  
    expect(mockAddToFavorites).toHaveBeenCalledTimes(1);
  
    // Click to remove from favorites
    fireEvent.click(starButton);
  
    // Wait for the UI to update again
    await waitFor(() => {
      starButton = screen.getByTestId('star-icon');
      expect(starButton.closest('button')).toHaveAttribute('title', 'Add to Favorites');
    });
  
    expect(mockRemoveFromFavorites).toHaveBeenCalledTimes(1);
  });
  
});