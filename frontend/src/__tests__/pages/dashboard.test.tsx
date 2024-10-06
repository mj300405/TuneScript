import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../../pages/dashboard';

// Mock the entire @apollo/client module
jest.mock('@apollo/client', () => ({
  gql: jest.fn(),
  useQuery: jest.fn(),
}));

// Mock the Layout component
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock the TranscriptionDetails component
jest.mock('../../components/TranscriptionDetails', () => {
  return function MockTranscriptionDetails({ transcriptionId, onClose, onDelete }: any) {
    return (
      <div data-testid="mock-transcription-details">
        Mock TranscriptionDetails for ID: {transcriptionId}
        <button onClick={onClose}>Close</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    );
  };
});

const mockDashboardData = {
  highestRatedTranscriptions: [
    { id: '1', title: 'High Rated 1', composer: 'Composer 1', avgRating: 4.5 },
    { id: '2', title: 'High Rated 2', composer: 'Composer 2', avgRating: 4.3 },
  ],
  recentTranscriptions: [
    { id: '3', title: 'Recent 1', composer: 'Composer 3', createdAt: '2023-09-01T00:00:00Z' },
    { id: '4', title: 'Recent 2', composer: 'Composer 4', createdAt: '2023-08-31T00:00:00Z' },
  ],
  recommendedTranscriptions: [
    { id: '5', title: 'Recommended 1', composer: 'Composer 5', tags: [{ id: '1', name: 'Jazz' }] },
    { id: '6', title: 'Recommended 2', composer: 'Composer 6', tags: [{ id: '2', name: 'Classical' }] },
  ],
  userStatistics: {
    totalTranscriptions: 10,
    averageRating: 4.2,
    totalPlayTime: 3600 * 5, // 5 hours
  },
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', async () => {
    const useQueryMock = require('@apollo/client').useQuery;
    useQueryMock.mockReturnValue({ loading: true, error: undefined, data: undefined });

    render(<Dashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard data', async () => {
    const useQueryMock = require('@apollo/client').useQuery;
    useQueryMock.mockReturnValue({ loading: false, error: undefined, data: mockDashboardData });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Highest Rated Transcriptions')).toBeInTheDocument();
    expect(screen.getByText('High Rated 1 by Composer 1 - Rating: 4.5')).toBeInTheDocument();

    expect(screen.getByText('Recently Added')).toBeInTheDocument();
    expect(screen.getByText('Recent 1 by Composer 3 - 9/1/2023')).toBeInTheDocument();

    expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    expect(screen.getByText('Recommended 1 by Composer 5 -')).toBeInTheDocument();
    expect(screen.getByText('Jazz')).toBeInTheDocument();

    expect(screen.getByText('Your Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Transcriptions: 10')).toBeInTheDocument();
    expect(screen.getByText('Average Rating: 4.20')).toBeInTheDocument();
    expect(screen.getByText('Total Play Time: 5 hours')).toBeInTheDocument();
  });

  it('opens TranscriptionDetails when a transcription is clicked', async () => {
    const useQueryMock = require('@apollo/client').useQuery;
    useQueryMock.mockReturnValue({ loading: false, error: undefined, data: mockDashboardData });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('High Rated 1 by Composer 1 - Rating: 4.5'));

    expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();
    expect(screen.getByText('Mock TranscriptionDetails for ID: 1')).toBeInTheDocument();
  });

  it('closes TranscriptionDetails when close button is clicked', async () => {
    const useQueryMock = require('@apollo/client').useQuery;
    useQueryMock.mockReturnValue({ loading: false, error: undefined, data: mockDashboardData });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('High Rated 1 by Composer 1 - Rating: 4.5'));
    expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('mock-transcription-details')).not.toBeInTheDocument();
  });

  it('handles TranscriptionDetails deletion', async () => {
    const mockRefetch = jest.fn();
    const useQueryMock = require('@apollo/client').useQuery;
    useQueryMock.mockReturnValue({ loading: false, error: undefined, data: mockDashboardData, refetch: mockRefetch });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('High Rated 1 by Composer 1 - Rating: 4.5'));
    expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete'));
    expect(mockRefetch).toHaveBeenCalled();
    expect(screen.queryByTestId('mock-transcription-details')).not.toBeInTheDocument();
  });

  it('handles error state', async () => {
    const useQueryMock = require('@apollo/client').useQuery;
    useQueryMock.mockReturnValue({ loading: false, error: new Error('An error occurred'), data: undefined });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error: An error occurred')).toBeInTheDocument();
    });
  });
});