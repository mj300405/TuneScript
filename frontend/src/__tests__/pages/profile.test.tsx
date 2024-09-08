import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '../../pages/profile';

// Mock window.alert
const alertMock = jest.fn();
window.alert = alertMock;

// Mock the entire @apollo/client module
jest.mock('@apollo/client', () => ({
  gql: jest.fn(),
  useQuery: jest.fn(),
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}));

// Mock the Layout component
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock the PasswordChange component
jest.mock('../../components/PasswordChange', () => {
  return function MockPasswordChange() {
    return <div data-testid="mock-password-change">Password Change Component</div>;
  };
});

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe('ProfilePage Component', () => {
  const mockProfile = {
    id: '1',
    bio: 'Test bio',
    public: true,
    preferences: JSON.stringify({ emailNotifications: true, darkMode: false }),
    isPremium: false,
    premiumStartDate: null,
    premiumEndDate: null,
    profilePicture: '/test-profile-picture.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    alertMock.mockClear();
  });

  it('renders loading state', () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: true, error: undefined, data: undefined });

    render(<ProfilePage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders profile data', async () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { profile: mockProfile } });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Bio')).toHaveValue('Test bio');
    expect(screen.getByLabelText('Make profile public')).toBeChecked();
    expect(screen.getByLabelText('Receive email notifications')).toBeChecked();
    expect(screen.getByLabelText('Use dark mode')).not.toBeChecked();
  });

  it('updates profile data', async () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { profile: mockProfile }, refetch: jest.fn() });

    const mockUpdateProfile = jest.fn().mockResolvedValue({
      data: {
        updateProfile: {
          profile: {
            ...mockProfile,
            bio: 'Updated bio',
            public: false,
            preferences: JSON.stringify({ emailNotifications: false, darkMode: true }),
          },
        },
      },
    });
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([mockUpdateProfile, { loading: false }]);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'Updated bio' } });
    fireEvent.click(screen.getByLabelText('Make profile public'));
    fireEvent.click(screen.getByLabelText('Receive email notifications'));
    fireEvent.click(screen.getByLabelText('Use dark mode'));

    fireEvent.click(screen.getByText('Update Profile'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
  });

  it('activates premium subscription', async () => {
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { profile: mockProfile }, refetch: jest.fn() });

    const mockActivatePremium = jest.fn().mockResolvedValue({
      data: {
        activatePremium: {
          profile: {
            isPremium: true,
            premiumStartDate: '2023-01-01',
            premiumEndDate: '2024-01-01',
          },
        },
      },
    });
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([mockActivatePremium, { loading: false }]);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Activate Premium'));

    await waitFor(() => {
      expect(mockActivatePremium).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('Premium subscription activated!');
    });
  });

  it('deactivates premium subscription', async () => {
    const premiumProfile = { ...mockProfile, isPremium: true, premiumStartDate: '2023-01-01', premiumEndDate: '2024-01-01' };
    const mockUseQuery = jest.requireMock('@apollo/client').useQuery;
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { profile: premiumProfile }, refetch: jest.fn() });

    const mockDeactivatePremium = jest.fn().mockResolvedValue({
      data: {
        deactivatePremium: {
          profile: {
            isPremium: false,
          },
        },
      },
    });
    const mockUseMutation = jest.requireMock('@apollo/client').useMutation;
    mockUseMutation.mockReturnValue([mockDeactivatePremium, { loading: false }]);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel Subscription'));

    await waitFor(() => {
      expect(mockDeactivatePremium).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('Premium subscription deactivated.');
    });
  });
});