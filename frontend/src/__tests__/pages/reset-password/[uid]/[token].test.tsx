import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordReset from '../../../../pages/reset-password/[uid]/[token]';

// Mock the useMutation hook
jest.mock('@apollo/client', () => ({
  gql: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the Layout component
jest.mock('../../../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

describe('PasswordReset Component', () => {
  const mockPasswordChange = jest.fn();
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('@apollo/client').useMutation).mockReturnValue([
      mockPasswordChange,
      { loading: false },
    ]);
    (require('next/router').useRouter).mockReturnValue({ 
      query: { uid: 'testuid', token: 'testtoken' },
      push: mockRouterPush,
    });
  });

  it('renders the password reset form', () => {
    render(<PasswordReset />);
    
    expect(screen.getByText('Set New Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<PasswordReset />);

    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('disables submit button for invalid reset link', async () => {
    (require('next/router').useRouter).mockReturnValue({ 
      query: {},
      push: mockRouterPush,
    });

    render(<PasswordReset />);

    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: 'Change Password' });
    expect(submitButton).toBeDisabled();

    // Verify that the error message is not displayed
    expect(screen.queryByText('Invalid reset link. Please request a new password reset.')).not.toBeInTheDocument();
  });

  it('handles successful password change', async () => {
    mockPasswordChange.mockResolvedValueOnce({
      data: {
        passwordChange: {
          success: true,
          message: 'Password changed successfully',
        },
      },
    });

    render(<PasswordReset />);

    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password successfully changed. Redirecting to login...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    }, { timeout: 3500 });
  });

  it('handles unsuccessful password change', async () => {
    mockPasswordChange.mockResolvedValueOnce({
      data: {
        passwordChange: {
          success: false,
          message: 'Password change failed',
        },
      },
    });

    render(<PasswordReset />);

    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password change failed')).toBeInTheDocument();
    });
  });

  it('handles error during password change', async () => {
    mockPasswordChange.mockRejectedValueOnce(new Error('Network error'));

    render(<PasswordReset />);

    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('disables submit button when loading', () => {
    (require('@apollo/client').useMutation).mockReturnValue([
      mockPasswordChange,
      { loading: true },
    ]);

    render(<PasswordReset />);

    expect(screen.getByRole('button', { name: 'Changing...' })).toBeDisabled();
  });
});