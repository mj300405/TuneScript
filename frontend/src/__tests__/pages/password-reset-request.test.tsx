import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordResetRequest from '../../pages/password-reset-request';

// Mock the entire @apollo/client module
jest.mock('@apollo/client', () => ({
  gql: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock the Layout component
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

describe('PasswordResetRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the password reset form', () => {
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false }]);

    render(<PasswordResetRequest />);

    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('allows entering an email address', () => {
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false }]);

    render(<PasswordResetRequest />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput.value).toBe('test@example.com');
  });

  it('submits the form and displays success message', async () => {
    const mockPasswordReset = jest.fn().mockResolvedValue({
      data: {
        passwordReset: {
          success: true,
          message: 'Password reset email sent',
        },
      },
    });
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([mockPasswordReset, { loading: false }]);

    render(<PasswordResetRequest />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password reset email sent')).toBeInTheDocument();
    });
    expect(mockPasswordReset).toHaveBeenCalledWith({ variables: { email: 'test@example.com' } });
  });

  it('displays loading state while submitting', async () => {
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([jest.fn(), { loading: true }]);

    render(<PasswordResetRequest />);
    
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
  });

  it('displays error message on submission failure', async () => {
    const mockPasswordReset = jest.fn().mockRejectedValue(new Error('An error occurred'));
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([mockPasswordReset, { loading: false }]);

    render(<PasswordResetRequest />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });
});