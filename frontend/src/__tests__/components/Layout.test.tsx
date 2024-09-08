import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '../../components/Layout';

// Mock the Header component
jest.mock('../../components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Mock Header</div>;
  };
});

// Mock the Next.js Head component
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    },
  };
});

// Mock the framer-motion library
jest.mock('framer-motion', () => {
  const mockMotionMain = jest.fn().mockImplementation(({ children, ...props }) => (
    <main data-testid="mock-motion-main" {...props}>
      {children}
    </main>
  ));

  return {
    motion: {
      main: mockMotionMain,
    },
  };
});

describe('Layout Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<Layout>Test Content</Layout>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders the Header component', () => {
    render(<Layout>Test Content</Layout>);
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
  });

  it('renders the children content', () => {
    render(<Layout><div>Child Component</div></Layout>);
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });

  it('sets the correct page title', () => {
    render(<Layout title="Custom Title">Test Content</Layout>);
    const titleElement = document.querySelector('title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement?.textContent).toBe('Custom Title');
  });

  it('uses the default title when no title prop is provided', () => {
    render(<Layout>Test Content</Layout>);
    const titleElement = document.querySelector('title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement?.textContent).toBe('TuneScript');
  });

  it('renders the motion.main component with correct props', () => {
    render(<Layout>Test Content</Layout>);
    const motionMain = screen.getByTestId('mock-motion-main');
    expect(motionMain).toHaveClass('pt-10');
  });
});