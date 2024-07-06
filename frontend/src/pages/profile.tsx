import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import Layout from '../components/Layout';

const GET_PROFILE = gql`
  query GetProfile {
    profile {
      id
      bio
      public
      preferences
      isPremium
      premiumStartDate
      premiumEndDate
      profilePicture
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($bio: String, $public: Boolean, $preferences: JSONString, $profilePicture: Upload) {
    updateProfile(bio: $bio, public: $public, preferences: $preferences, profilePicture: $profilePicture) {
      profile {
        id
        bio
        public
        preferences
        profilePicture
      }
    }
  }
`;

const ACTIVATE_PREMIUM = gql`
  mutation ActivatePremium {
    activatePremium {
      profile {
        isPremium
        premiumStartDate
        premiumEndDate
      }
    }
  }
`;

const DEACTIVATE_PREMIUM = gql`
  mutation DeactivatePremium {
    deactivatePremium {
      profile {
        isPremium
      }
    }
  }
`;

const ProfilePage = () => {
  const { loading, error, data, refetch } = useQuery(GET_PROFILE);
  const [updateProfile] = useMutation(UPDATE_PROFILE);
  const [activatePremium] = useMutation(ACTIVATE_PREMIUM);
  const [deactivatePremium] = useMutation(DEACTIVATE_PREMIUM);

  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data && data.profile) {
      setBio(data.profile.bio || '');
      setIsPublic(data.profile.public || false);
      
      const preferences = JSON.parse(data.profile.preferences || '{}');
      setEmailNotifications(preferences.emailNotifications || false);
      setDarkMode(preferences.darkMode || false);
      setCurrentProfilePicture(data.profile.profilePicture || null);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const preferences = JSON.stringify({ emailNotifications, darkMode });
    try {
      const result = await updateProfile({
        variables: {
          bio,
          public: isPublic,
          preferences,
          profilePicture: profilePicture
        },
      });
      if (result.data && result.data.updateProfile) {
        setCurrentProfilePicture(result.data.updateProfile.profile.profilePicture);
      }
      alert('Profile updated successfully!');
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleActivatePremium = async () => {
    try {
      await activatePremium();
      alert('Premium subscription activated!');
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to activate premium subscription');
    }
  };

  const handleDeactivatePremium = async () => {
    try {
      await deactivatePremium();
      alert('Premium subscription deactivated.');
      refetch();
    } catch (err) {
      console.error(err);
      alert('Failed to deactivate premium subscription');
    }
  };

  if (loading) return <Layout title="Profile">Loading...</Layout>;
  if (error) return <Layout title="Profile">Error: {error.message}</Layout>;

  return (
    <Layout title="Profile">
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Profile Picture</h2>
            <div className="flex items-center space-x-4">
              <img
                src={currentProfilePicture ? (currentProfilePicture.startsWith('data:') ? currentProfilePicture : `${process.env.NEXT_PUBLIC_API_URL}/media/${currentProfilePicture}`) : '/default-avatar.png'}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Change Picture
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Personal Information</h2>
            <div className="mb-4">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                rows={4}
              />
            </div>
            <div className="flex items-center">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Make profile public
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Preferences</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                  Receive email notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="darkMode"
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-900">
                  Use dark mode
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Profile
            </button>
          </div>
        </form>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Subscription Status</h2>
          {data.profile.isPremium ? (
            <div>
              <p className="text-green-600 font-medium">Active Premium Member</p>
              <p className="text-sm text-gray-600">
                Start Date: {new Date(data.profile.premiumStartDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                End Date: {new Date(data.profile.premiumEndDate).toLocaleDateString()}
              </p>
              <button
                onClick={handleDeactivatePremium}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancel Subscription
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">You are not a premium member.</p>
              <button
                onClick={handleActivatePremium}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Activate Premium
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;