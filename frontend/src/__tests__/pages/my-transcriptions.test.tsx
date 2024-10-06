import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyTranscriptions from '../../pages/my-transcriptions';

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
  return function MockTranscriptionDetails({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="mock-transcription-details">
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

const mockTranscriptions = [
  {
    id: '1',
    title: 'Test Transcription 1',
    composer: 'Composer 1',
    tags: [{ id: '1', name: 'Jazz' }, { id: '2', name: 'Piano' }],
    player: 'Player 1',
    visibility: 'public',
    status: 'completed',
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
    status: 'pending',
    createdAt: '2023-01-02T00:00:00Z',
    avgRating: null,
  },
];

describe('MyTranscriptions Component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: true, error: undefined, data: undefined });

    render(<MyTranscriptions />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: new Error('An error occurred'), data: undefined });

    render(<MyTranscriptions />);

    expect(screen.getByText('Error: An error occurred')).toBeInTheDocument();
  });

  it('renders transcriptions list', async () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { myTranscriptions: mockTranscriptions } });

    render(<MyTranscriptions />);

    expect(screen.getByText('My Transcriptions')).toBeInTheDocument();
    expect(screen.getByText('Test Transcription 1')).toBeInTheDocument();
    expect(screen.getByText('Test Transcription 2')).toBeInTheDocument();
    expect(screen.getByText('Composer: Composer 1')).toBeInTheDocument();
    expect(screen.getByText('Jazz')).toBeInTheDocument();
    expect(screen.getByText('Piano')).toBeInTheDocument();
    expect(screen.getByText('Classical')).toBeInTheDocument();
    expect(screen.getByText('Violin')).toBeInTheDocument();
    expect(screen.getByText('Average Rating: 4.5')).toBeInTheDocument();
    expect(screen.getByText('Average Rating: No ratings')).toBeInTheDocument();
  });

  it('opens TranscriptionDetails when View Details is clicked', async () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { myTranscriptions: mockTranscriptions } });

    render(<MyTranscriptions />);

    fireEvent.click(screen.getAllByText('View Details')[0]);

    expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();
  });

  it('closes TranscriptionDetails when Close is clicked', async () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { myTranscriptions: mockTranscriptions } });

    render(<MyTranscriptions />);

    fireEvent.click(screen.getAllByText('View Details')[0]);
    expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('mock-transcription-details')).not.toBeInTheDocument();
  });
});