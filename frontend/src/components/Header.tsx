import React, { useState, useRef, useContext } from 'react';
import { useQuery, useMutation, gql, useApolloClient } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import AuthContext from '../context/AuthContext';

const GET_PROFILE_PICTURE = gql`
  query GetProfilePicture {
    profile {
      profilePicture
    }
  }
`;

const UPDATE_PROFILE_PICTURE = gql`
  mutation UpdateProfilePicture($profilePicture: Upload!) {
    updateProfile(profilePicture: $profilePicture) {
      profile {
        profilePicture
      }
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

const DEFAULT_PROFILE_PICTURE = '/static/images/default_profile_picture.png';

const Header = () => {
  const { isAuthenticated, logout: authLogout } = useContext(AuthContext);
  const { data, refetch } = useQuery(GET_PROFILE_PICTURE, {
    skip: !isAuthenticated
  });
  const [updateProfilePicture] = useMutation(UPDATE_PROFILE_PICTURE);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const client = useApolloClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await updateProfilePicture({ variables: { profilePicture: file } });
        refetch();
      } catch (err) {
        console.error('Failed to update profile picture:', err);
      }
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const { data } = await logoutMutation();
      if (data.logout.success) {
        await client.resetStore();
        authLogout(); // Call the logout function from AuthContext
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = DEFAULT_PROFILE_PICTURE;
  };

  const profilePictureUrl = data?.profile?.profilePicture
    ? `${process.env.NEXT_PUBLIC_API_URL}${data.profile.profilePicture}`
    : DEFAULT_PROFILE_PICTURE;

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/">
          <a className="text-2xl font-bold text-blue-600">TuneScript</a>
        </Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              <Link href="/search">
                <a className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Search</a>
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link href="/dashboard">
                    <a className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Dashboard</a>
                  </Link>
                </li>
                <li>
                  <Link href="/upload">
                    <a className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Upload MP3</a>
                  </Link>
                </li>
                <li className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img
                      src={profilePictureUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </motion.button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link href="/profile">
                        <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                      </Link>
                      <Link href="/my-transcriptions">
                        <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Transcriptions</a>
                      </Link>
                      <a href="#" onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login">
                    <a className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Login</a>
                  </Link>
                </li>
                <li>
                  <Link href="/register">
                    <a className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Register</a>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;