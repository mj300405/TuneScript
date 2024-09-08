import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../../pages/register';

jest.mock('@apollo/client', () => ({
  gql: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the registration form', () => {
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false }]);

    render(<Register />);

    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account? Login')).toBeInTheDocument();
  });

  it('updates form fields when user types', () => {
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false }]);

    render(<Register />);

    const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('submits the form and shows success message', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      data: {
        register: {
          user: {
            id: '1',
            username: 'testuser',
          },
        },
      },
    });
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([mockRegister, { loading: false }]);

    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByText('Registration successful! Please check your email to confirm your account.')).toBeInTheDocument();
    });

    expect(mockRegister).toHaveBeenCalledWith({
      variables: { username: 'testuser', email: 'test@example.com', password: 'password123' },
    });

    expect(screen.getByPlaceholderText('Username')).toHaveValue('');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('');
  });

  it('shows error message on registration failure', async () => {
    const mockRegister = jest.fn().mockRejectedValue(new Error('Registration failed'));
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([mockRegister, { loading: false }]);

    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('submits the form and shows success message after completion', async () => {
    const mockRegister = jest.fn().mockResolvedValue({
      data: { register: { user: { id: '1', username: 'testuser' } } }
    });
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([mockRegister, { loading: false }]);
  
    render(<Register />);
  
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
  
    const registerButton = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerButton);
  
    // Check for the success message
    await waitFor(() => {
      expect(screen.getByText('Registration successful! Please check your email to confirm your account.')).toBeInTheDocument();
    });
  
    // Check that form fields are cleared
    expect(screen.getByPlaceholderText('Username')).toHaveValue('');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('');
  
    // Verify that the register mutation was called with the correct variables
    expect(mockRegister).toHaveBeenCalledWith({
      variables: { username: 'testuser', email: 'test@example.com', password: 'password123' }
    });
  });
});