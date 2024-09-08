import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Search from '../../pages/search';

jest.mock('@apollo/client', () => ({
  gql: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

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
    title: 'Moonlight Sonata',
    composer: 'Beethoven',
    genre: 'Classical',
    player: 'Piano',
    visibility: 'public',
    avgRating: 4.5,
    userRating: 5,
    numRatings: 100,
  },
  {
    id: '2',
    title: 'Für Elise',
    composer: 'Beethoven',
    genre: 'Classical',
    player: 'Piano',
    visibility: 'public',
    avgRating: 4.2,
    userRating: null,
    numRatings: 80,
  },
];

describe('Search Component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the search form', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: undefined });

    render(<Search />);

    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Composer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Genre')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Player')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Minimum Rating')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: true, error: undefined, data: undefined });

    render(<Search />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: { message: 'An error occurred' }, data: undefined });

    render(<Search />);

    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('displays search results', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { transcriptions: mockTranscriptions } });

    render(<Search />);

    expect(screen.getByText('Moonlight Sonata')).toBeInTheDocument();
    expect(screen.getByText('Für Elise')).toBeInTheDocument();
    expect(screen.getAllByText('Composer: Beethoven')).toHaveLength(2);
    expect(screen.getByText('Average Rating: 4.5')).toBeInTheDocument();
    expect(screen.getByText('Your Rating: 5.0')).toBeInTheDocument();
    expect(screen.getByText('Your Rating: Not rated')).toBeInTheDocument();
  });

  it('handles search form inputs', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: undefined, refetch: jest.fn() });

    render(<Search />);

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Moonlight' } });
    fireEvent.change(screen.getByPlaceholderText('Composer'), { target: { value: 'Beethoven' } });
    fireEvent.change(screen.getByPlaceholderText('Genre'), { target: { value: 'Classical' } });
    fireEvent.change(screen.getByPlaceholderText('Player'), { target: { value: 'Piano' } });
    fireEvent.change(screen.getByPlaceholderText('Minimum Rating'), { target: { value: '4' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'public' } });

    expect(screen.getByPlaceholderText('Title')).toHaveValue('Moonlight');
    expect(screen.getByPlaceholderText('Composer')).toHaveValue('Beethoven');
    expect(screen.getByPlaceholderText('Genre')).toHaveValue('Classical');
    expect(screen.getByPlaceholderText('Player')).toHaveValue('Piano');
    expect(screen.getByPlaceholderText('Minimum Rating')).toHaveValue(4);
    expect(screen.getByRole('combobox')).toHaveValue('public');
  });

  it('opens TranscriptionDetails when View Details is clicked', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { transcriptions: mockTranscriptions } });

    render(<Search />);

    fireEvent.click(screen.getAllByText('View Details')[0]);

    expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();
  });

  it('closes TranscriptionDetails when Close is clicked', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { transcriptions: mockTranscriptions } });

    render(<Search />);

    fireEvent.click(screen.getAllByText('View Details')[0]);
    expect(screen.getByTestId('mock-transcription-details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('mock-transcription-details')).not.toBeInTheDocument();
  });
});