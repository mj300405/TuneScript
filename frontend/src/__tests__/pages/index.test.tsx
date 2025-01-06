import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../../pages/index';

// Mock the Layout component
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Home Component', () => {
  it('renders the hero section', () => {
    render(<Home />);

    expect(screen.getByText('Welcome to TuneScript')).toBeInTheDocument();
    expect(screen.getByText('Your ultimate platform for uploading, managing, and discovering piano transcriptions.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Explore Transcriptions' })).toHaveAttribute('href', '/search');
  });

  it('renders the features section', () => {
    render(<Home />);

    expect(screen.getByText('Why Choose TuneScript?')).toBeInTheDocument();
    expect(screen.getByText('Easy Upload')).toBeInTheDocument();
    expect(screen.getByText('Smart Search')).toBeInTheDocument();
    expect(screen.getByText('Community Sharing')).toBeInTheDocument();
  });

  it('renders the call to action section', () => {
    render(<Home />);

    expect(screen.getByText('Ready to Start Your Musical Journey?')).toBeInTheDocument();
    expect(screen.getByText('Join TuneScript today and transform the way you interact with sheet music.')).toBeInTheDocument();
    const signUpLink = screen.getByRole('link', { name: 'Sign Up Now' });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('renders feature cards with correct content', () => {
    render(<Home />);

    const featureCards = screen.getAllByRole('heading', { level: 3 });
    expect(featureCards).toHaveLength(3);

    expect(screen.getByText('🎵')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();

    expect(screen.getByText('Quickly upload your audio files and get accurate transcriptions in minutes.')).toBeInTheDocument();
    expect(screen.getByText('Find the perfect transcription with our advanced search features.')).toBeInTheDocument();
    expect(screen.getByText('Share your transcriptions and discover new music from other users.')).toBeInTheDocument();
  });

  it('uses the correct layout title', () => {
    render(<Home />);

    const layout = screen.getByTestId('mock-layout');
    expect(layout).toBeInTheDocument();
  });
});