import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TagSelection from '../../components/TagSelection';
import * as apolloClient from '@apollo/client';

jest.mock('@apollo/client');

const mockTags = [
  { id: "1", name: 'Jazz' },
  { id: "2", name: 'Classical' },
  { id: "3", name: 'Rock' },
];

const mockOnTagsChange = jest.fn();

describe('TagSelection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    (apolloClient.useQuery as jest.Mock).mockReturnValue({
      loading: true,
      error: undefined,
      data: undefined,
    });

    render(<TagSelection onTagsChange={mockOnTagsChange} />);
    expect(screen.getByText('Loading tags...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (apolloClient.useQuery as jest.Mock).mockReturnValue({
      loading: false,
      error: new Error('An error occurred'),
      data: undefined,
    });

    render(<TagSelection onTagsChange={mockOnTagsChange} />);
    expect(screen.getByText('Error loading tags: An error occurred')).toBeInTheDocument();
  });

  it('renders tags and allows selection', () => {
    (apolloClient.useQuery as jest.Mock).mockReturnValue({
      loading: false,
      error: undefined,
      data: { allTags: mockTags },
    });

    render(<TagSelection onTagsChange={mockOnTagsChange} />);

    expect(screen.getByText('Jazz')).toBeInTheDocument();
    expect(screen.getByText('Classical')).toBeInTheDocument();
    expect(screen.getByText('Rock')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Jazz'));
    expect(mockOnTagsChange).toHaveBeenCalledWith(["1"]);

    fireEvent.click(screen.getByText('Classical'));
    expect(mockOnTagsChange).toHaveBeenCalledWith(["1", "2"]);

    fireEvent.click(screen.getByText('Jazz'));
    expect(mockOnTagsChange).toHaveBeenCalledWith(["2"]);
  });

  it('applies correct styles to selected tags', () => {
    (apolloClient.useQuery as jest.Mock).mockReturnValue({
      loading: false,
      error: undefined,
      data: { allTags: mockTags },
    });

    render(<TagSelection onTagsChange={mockOnTagsChange} />);

    const jazzButton = screen.getByText('Jazz');
    fireEvent.click(jazzButton);

    expect(jazzButton).toHaveClass('bg-blue-500');
    expect(jazzButton).toHaveClass('text-white');

    fireEvent.click(jazzButton);

    expect(jazzButton).not.toHaveClass('bg-blue-500');
    expect(jazzButton).not.toHaveClass('text-white');
    expect(jazzButton).toHaveClass('bg-gray-200');
  });
});