import React, { useState, useRef, useContext, useEffect } from 'react';
import { useQuery, useMutation, gql, useApolloClient } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import AuthContext from '../context/AuthContext';

const GET_PROFILE_PICTURE = gql`
  query GetProfilePicture {
    profile {
      profilePicture
      isPremium
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

const DEFAULT_PROFILE_PICTURE = 'http://localhost:8000/static/images/default_profile_picture.png';

const Header = () => {
  const { isAuthenticated, logout: authLogout, user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const client = useApolloClient();

  const { refetch } = useQuery(GET_PROFILE_PICTURE, {
    skip: true, // We'll manually call this query in useEffect
  });

  const [updateProfilePicture] = useMutation(UPDATE_PROFILE_PICTURE);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  useEffect(() => {
    if (isAuthenticated) {
      refetch()
        .then(({ data }) => {
          setProfileData(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching profile picture:', error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, refetch]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const { data } = await updateProfilePicture({ variables: { profilePicture: file } });
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
        authLogout();
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const profilePictureUrl = profileData?.profile?.profilePicture || DEFAULT_PROFILE_PICTURE;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          TuneScript
        </Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              <Link href="/search" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                Search
              </Link>
            </li>
            {isAuthenticated && user ? (
              <>
                <li>
                  <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/upload" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                    Upload MP3
                  </Link>
                </li>
                <li className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Image
                      src={profilePictureUrl}
                      alt="Profile"
                      width={40}
                      height={40}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                    {profileData?.profile?.isPremium && (
                      <span className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-1 rounded-full">P</span>
                    )}
                  </motion.button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profile
                      </Link>
                      <Link href="/my-transcriptions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        My Transcriptions
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Logout
                      </button>
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
                  <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                    Register
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