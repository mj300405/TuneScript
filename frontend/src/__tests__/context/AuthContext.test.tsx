import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test component that uses the auth context
const TestComponent = () => {
  const { isAuthenticated, user, login, logout } = useContext(AuthContext);
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-info">{user.username}</div>}
      <button onClick={() => login('test-token', { id: '1', username: 'testuser' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial unauthenticated state', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    });
  });

  it('updates state on login and logout', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');

    // Login
    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('testuser');
    });

    // Logout
    act(() => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    });
  });

  it('persists authentication state in localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login
    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: '1', username: 'testuser' }));
    });

    // Logout
    act(() => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  it('restores authentication state from localStorage', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'saved-token';
      if (key === 'user') return JSON.stringify({ id: '2', username: 'saveduser' });
      return null;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('saveduser');
    });
  });
});