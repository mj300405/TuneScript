import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../pages/login';

jest.mock('@apollo/client', () => ({
  gql: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  __esModule: true,
  default: React.createContext({ login: jest.fn() }),
}));

jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

describe('Login Component', () => {
  const mockLogin = jest.fn();
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('@apollo/client').useMutation).mockReturnValue([
      mockLogin,
      { loading: false },
    ]);
    (require('next/router').useRouter).mockReturnValue({ push: mockRouterPush });
  });

  it('renders the login form', () => {
    render(<Login />);
    
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByText("Don't have an account? Register")).toBeInTheDocument();
  });

  it('handles form submission with valid credentials', async () => {
    mockLogin.mockResolvedValueOnce({
      data: {
        tokenAuth: {
          token: 'fake-token',
          user: { id: '1', username: 'testuser', emailConfirmed: true },
        },
      },
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        variables: { username: 'testuser', password: 'password123' },
      });
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error for unconfirmed email', async () => {
    mockLogin.mockResolvedValueOnce({
      data: {
        tokenAuth: {
          token: 'fake-token',
          user: { id: '1', username: 'testuser', emailConfirmed: false },
        },
      },
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Please confirm your email before logging in.')).toBeInTheDocument();
    });
  });

  it('shows error for invalid credentials', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument();
    });
  });

  it('displays loading state during form submission', async () => {
    (require('@apollo/client').useMutation).mockReturnValue([
      jest.fn(),
      { loading: true },
    ]);
  
    render(<Login />);
  
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /login|loading/i });
    fireEvent.click(submitButton);
  
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Loading...');
    });
  });
});