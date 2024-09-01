import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import AuthContext from '../context/AuthContext';
import Header from '../components/Header';
import * as apolloClient from '@apollo/client';

jest.mock('@apollo/client');

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

const mockUser = {
  id: '1',
  username: 'testuser',
};

const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the useQuery hook
    (apolloClient.useQuery as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      data: {
        profile: {
          profilePicture: 'http://example.com/profile.jpg',
          isPremium: true,
        },
      },
      refetch: jest.fn().mockResolvedValue({
        data: {
          profile: {
            profilePicture: 'http://example.com/profile.jpg',
            isPremium: true,
          },
        },
      }),
    });
  });

  it('renders unauthenticated state correctly', async () => {
    render(
      <MockedProvider>
        <AuthContext.Provider value={mockAuthContext}>
          <Header />
        </AuthContext.Provider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TuneScript')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Upload MP3')).not.toBeInTheDocument();
    });
  });

  it('renders authenticated state correctly', async () => {
    const authenticatedContext = { ...mockAuthContext, isAuthenticated: true, user: mockUser };
    render(
      <MockedProvider>
        <AuthContext.Provider value={authenticatedContext}>
          <Header />
        </AuthContext.Provider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Upload MP3')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });
  });

  it('opens dropdown menu when profile picture is clicked', async () => {
    const authenticatedContext = { ...mockAuthContext, isAuthenticated: true, user: mockUser };
    render(
      <MockedProvider>
        <AuthContext.Provider value={authenticatedContext}>
          <Header />
        </AuthContext.Provider>
      </MockedProvider>
    );

    await waitFor(() => {
      const profileButton = screen.getByRole('button');
      fireEvent.click(profileButton);
    });

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('My Transcriptions')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls logout function when logout is clicked', async () => {
    const mockLogout = jest.fn();
    const mockResetStore = jest.fn();
    const mockPush = jest.fn();
    const mockLogoutMutation = jest.fn().mockResolvedValue({ data: { logout: { success: true } } });

    (apolloClient.useMutation as jest.Mock).mockReturnValue([mockLogoutMutation, { loading: false, error: null }]);
    (apolloClient.useApolloClient as jest.Mock).mockReturnValue({ resetStore: mockResetStore });

    const { useRouter } = require('next/router');
    useRouter.mockReturnValue({ push: mockPush });

    const authenticatedContext = { 
      ...mockAuthContext, 
      isAuthenticated: true, 
      user: mockUser,
      logout: mockLogout
    };

    render(
      <MockedProvider>
        <AuthContext.Provider value={authenticatedContext}>
          <Header />
        </AuthContext.Provider>
      </MockedProvider>
    );

    // Wait for the component to render
    await waitFor(() => {
      const profileButton = screen.getByRole('button');
      expect(profileButton).toBeInTheDocument();
    });

    // Click the profile button to open the dropdown
    const profileButton = screen.getByRole('button');
    fireEvent.click(profileButton);

    // Wait for the dropdown to appear
    await waitFor(() => {
      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();
    });

    // Click the logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Wait for the logout process to complete
    await waitFor(() => {
      expect(mockLogoutMutation).toHaveBeenCalled();
      expect(mockResetStore).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('displays premium badge for premium users', async () => {
    const authenticatedContext = { ...mockAuthContext, isAuthenticated: true, user: mockUser };
    render(
      <MockedProvider>
        <AuthContext.Provider value={authenticatedContext}>
          <Header />
        </AuthContext.Provider>
      </MockedProvider>
    );

    await waitFor(() => {
      const premiumBadge = screen.getByText('P');
      expect(premiumBadge).toBeInTheDocument();
    });
  });
});