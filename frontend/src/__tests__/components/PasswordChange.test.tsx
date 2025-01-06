import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordChange from '../../components/PasswordChange';
import { useMutation } from '@apollo/client';

jest.mock('@apollo/client');

describe('PasswordChange Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits the form and shows success message', async () => {
    const mockMutate = jest.fn().mockResolvedValue({
      data: {
        updatePassword: {
          success: true,
          message: 'Password successfully changed',
        },
      },
    });

    (useMutation as jest.Mock).mockReturnValue([
      mockMutate,
      { loading: false, error: null, data: null },
    ]);

    render(<PasswordChange />);

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password successfully changed')).toBeInTheDocument();
    });

    expect(mockMutate).toHaveBeenCalledWith({
      variables: { currentPassword: 'oldpass', newPassword: 'newpass' },
    });
  });

  it('handles API errors', async () => {
    const mockMutate = jest.fn().mockRejectedValue(new Error('An error occurred'));

    (useMutation as jest.Mock).mockReturnValue([
      mockMutate,
      { loading: false, error: new Error('An error occurred'), data: null },
    ]);

    render(<PasswordChange />);

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });

    expect(mockMutate).toHaveBeenCalledWith({
      variables: { currentPassword: 'oldpass', newPassword: 'newpass' },
    });
  });

  it('shows an error message when passwords do not match', async () => {
    (useMutation as jest.Mock).mockReturnValue([
      jest.fn(),
      { loading: false, error: null, data: null },
    ]);

    render(<PasswordChange />);

    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'differentpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    expect(screen.getByText("New passwords don't match.")).toBeInTheDocument();
  });
});