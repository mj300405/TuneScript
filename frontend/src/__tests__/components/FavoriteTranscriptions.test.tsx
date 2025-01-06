import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FavoriteTranscriptions from '../../components/FavoriteTranscriptions';
import * as apolloClient from '@apollo/client';

// Mock components
const MockTranscriptionDetails = ({ onClose }: { onClose: () => void }) => (
  <div data-testid="mock-transcription-details">
    <button onClick={onClose}>Close</button>
  </div>
);

const MockLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-layout">{children}</div>
);

// Mock data
const mockFavoriteTranscriptions = [
  {
    id: '1',
    title: 'Test Transcription 1',
    composer: 'Composer 1',
    tags: [{ id: '1', name: 'Jazz' }, { id: '2', name: 'Piano' }],
    player: 'Player 1',
    visibility: 'public',
    status: 'COMPLETED',
    createdAt: '2023-01-01T00:00:00Z',
    avgRating: 4.5,
  },
  {
    id: '2',
    title: 'Test Transcription 2',
    composer: 'Composer 2',
    tags: [{ id: '3', name: 'Classical' }, { id: '4', name: 'Violin' }],
    player: 'Player 2',
    visibility: 'private',
    status: 'PENDING',
    createdAt: '2023-01-02T00:00:00Z',
    avgRating: 3.8,
  },
];

describe('FavoriteTranscriptions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: true,
      error: undefined,
      data: undefined,
    } as any);

    render(
      <FavoriteTranscriptions
        TranscriptionDetailsComponent={MockTranscriptionDetails}
        LayoutComponent={MockLayout}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders favorite transcriptions', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { userFavorites: mockFavoriteTranscriptions },
    } as any);

    render(
      <FavoriteTranscriptions
        TranscriptionDetailsComponent={MockTranscriptionDetails}
        LayoutComponent={MockLayout}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Favorite Transcriptions')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Transcription 1')).toBeInTheDocument();
    expect(screen.getByText('Test Transcription 2')).toBeInTheDocument();
    expect(screen.getByText('Composer: Composer 1')).toBeInTheDocument();
    expect(screen.getByText('Jazz')).toBeInTheDocument();
    expect(screen.getByText('Piano')).toBeInTheDocument();
    expect(screen.getByText('Classical')).toBeInTheDocument();
    expect(screen.getByText('Violin')).toBeInTheDocument();
  });

  it('opens transcription details when "View Details" is clicked', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { userFavorites: mockFavoriteTranscriptions },
    } as any);

    render(
      <FavoriteTranscriptions
        TranscriptionDetailsComponent={MockTranscriptionDetails}
        LayoutComponent={MockLayout}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Favorite Transcriptions')).toBeInTheDocument();
    });

    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();
    });
  });

  it('closes transcription details when close button is clicked', async () => {
    const mockRefetch = jest.fn();
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: undefined,
      data: { userFavorites: mockFavoriteTranscriptions },
      refetch: mockRefetch,
    } as any);

    render(
      <FavoriteTranscriptions
        TranscriptionDetailsComponent={MockTranscriptionDetails}
        LayoutComponent={MockLayout}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Favorite Transcriptions')).toBeInTheDocument();
    });

    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-transcription-details')).not.toBeInTheDocument();
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders error state', async () => {
    jest.spyOn(apolloClient, 'useQuery').mockReturnValue({
      loading: false,
      error: new Error('An error occurred'),
      data: undefined,
    } as any);

    render(
      <FavoriteTranscriptions
        TranscriptionDetailsComponent={MockTranscriptionDetails}
        LayoutComponent={MockLayout}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error: An error occurred')).toBeInTheDocument();
    });
  });
});