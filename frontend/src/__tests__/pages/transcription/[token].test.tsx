import React from 'react';
import { render, screen } from '@testing-library/react';
import SharedTranscriptionPage, { GET_TRANSCRIPTION_BY_SHARE_TOKEN } from '../../../pages/transcription/[token]';

// Mock the useQuery hook
jest.mock('@apollo/client', () => ({
  gql: jest.fn(),
  useQuery: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the Layout component
jest.mock('../../../components/Layout', () => {
  return function MockLayout({ children, title }: { children: React.ReactNode, title: string }) {
    return <div data-testid="mock-layout" data-title={title}>{children}</div>;
  };
});

// Mock the TranscriptionDetails component
jest.mock('../../../components/TranscriptionDetails', () => {
  return function MockTranscriptionDetails({ transcriptionId, onClose, onDelete }: { transcriptionId: string, onClose: () => void, onDelete: () => void }) {
    return <div data-testid="mock-transcription-details" data-id={transcriptionId}>Transcription Details</div>;
  };
});

describe('SharedTranscriptionPage', () => {
  const mockUseRouter = jest.requireMock('next/router').useRouter;
  const mockUseQuery = jest.requireMock('@apollo/client').useQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ query: { token: 'test-token' }, push: jest.fn() });
  });

  it('renders loading state', () => {
    mockUseQuery.mockReturnValue({ loading: true, error: undefined, data: undefined });

    render(<SharedTranscriptionPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('mock-layout')).toHaveAttribute('data-title', 'Shared Transcription');
  });

  it('renders error state', () => {
    mockUseQuery.mockReturnValue({ loading: false, error: { message: 'Test error' }, data: undefined });

    render(<SharedTranscriptionPage />);

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    expect(screen.getByTestId('mock-layout')).toHaveAttribute('data-title', 'Shared Transcription');
  });

  it('renders message when transcription does not exist', () => {
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { transcriptionByShareToken: null } });

    render(<SharedTranscriptionPage />);

    expect(screen.getByText("This transcription doesn't exist or is not shared publicly.")).toBeInTheDocument();
    expect(screen.getByTestId('mock-layout')).toHaveAttribute('data-title', 'Shared Transcription');
  });

  it('renders TranscriptionDetails when data is fetched successfully', () => {
    const mockTranscription = {
      id: '123',
      title: 'Test Transcription',
      composer: 'Test Composer',
      player: 'Test Player',
      tags: [
        { id: '1', name: 'Jazz' },
        { id: '2', name: 'Piano' }
      ],
      avgRating: 4.5,
      numRatings: 10,
    };

    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { transcriptionByShareToken: mockTranscription } });

    render(<SharedTranscriptionPage />);

    expect(screen.getByTestId('mock-transcription-details')).toHaveAttribute('data-id', '123');
    expect(screen.getByTestId('mock-layout')).toHaveAttribute('data-title', 'Shared: Test Transcription');
  });

  it('skips query when token is not available', () => {
    mockUseRouter.mockReturnValue({ query: {}, push: jest.fn() });
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: undefined });

    render(<SharedTranscriptionPage />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      GET_TRANSCRIPTION_BY_SHARE_TOKEN,
      expect.objectContaining({
        variables: { token: undefined },
        skip: true
      })
    );
  });
});