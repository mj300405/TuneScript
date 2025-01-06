import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import ConfirmEmail, { CONFIRM_EMAIL } from '../../../../pages/confirm-email/[uid]/[token]';
import * as apolloHooks from '@apollo/client';

jest.mock('@apollo/client');

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

describe('ConfirmEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial loading state', async () => {
    const mockRouter = { query: { uid: 'test-uid', token: 'test-token' } };
    (require('next/router').useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apolloHooks.useMutation as jest.Mock).mockReturnValue([
      jest.fn().mockResolvedValue({ data: { confirmEmail: { success: true } } }),
      { loading: true },
    ]);

    render(
      <MockedProvider mocks={[]}>
        <ConfirmEmail />
      </MockedProvider>
    );

    expect(screen.getByText('Confirming your email...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Email confirmed successfully! You can now log in.')).toBeInTheDocument();
    });
  });

  it('displays success message when email is confirmed', async () => {
    const mockRouter = { query: { uid: 'test-uid', token: 'test-token' } };
    (require('next/router').useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apolloHooks.useMutation as jest.Mock).mockReturnValue([
      jest.fn().mockResolvedValue({ data: { confirmEmail: { success: true } } }),
      { loading: false },
    ]);

    render(
      <MockedProvider mocks={[]}>
        <ConfirmEmail />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Email confirmed successfully! You can now log in.')).toBeInTheDocument();
    });
  });

  it('displays failure message when email confirmation fails', async () => {
    const mockRouter = { query: { uid: 'test-uid', token: 'test-token' } };
    (require('next/router').useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apolloHooks.useMutation as jest.Mock).mockReturnValue([
      jest.fn().mockResolvedValue({ data: { confirmEmail: { success: false } } }),
      { loading: false },
    ]);

    render(
      <MockedProvider mocks={[]}>
        <ConfirmEmail />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Email confirmation failed. The link may be invalid or expired.')).toBeInTheDocument();
    });
  });

  it('displays error message when an error occurs', async () => {
    const mockRouter = { query: { uid: 'test-uid', token: 'test-token' } };
    (require('next/router').useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apolloHooks.useMutation as jest.Mock).mockReturnValue([
      jest.fn().mockRejectedValue(new Error('An error occurred')),
      { loading: false },
    ]);

    render(
      <MockedProvider mocks={[]}>
        <ConfirmEmail />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('An error occurred while confirming your email.')).toBeInTheDocument();
    });
  });

  it('does not call confirmEmail mutation when uid or token is missing', async () => {
    const mockRouter = { query: {} };
    (require('next/router').useRouter as jest.Mock).mockReturnValue(mockRouter);
    const mockConfirmEmail = jest.fn();
    (apolloHooks.useMutation as jest.Mock).mockReturnValue([mockConfirmEmail, { loading: false }]);

    render(
      <MockedProvider mocks={[]}>
        <ConfirmEmail />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid confirmation link. Please check your email for the correct link.')).toBeInTheDocument();
    });
    expect(mockConfirmEmail).not.toHaveBeenCalled();
  });
});