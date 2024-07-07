import React, { useState, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Image from 'next/image';

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

const Header = () => {
  const { data, refetch } = useQuery(GET_PROFILE_PICTURE);
  const [updateProfilePicture] = useMutation(UPDATE_PROFILE_PICTURE);
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/">
          <a className="text-2xl font-bold text-blue-600">TuneScript</a>
        </Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              <Link href="/dashboard">
                <a className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Dashboard</a>
              </Link>
            </li>
            <li>
              <Link href="/search">
                <a className="text-gray-600 hover:text-blue-600 transition-colors duration-200">Search</a>
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
                  src={data?.profile?.profilePicture 
                    ? `${process.env.NEXT_PUBLIC_API_URL}/media/${data.profile.profilePicture}`
                    : '/default-avatar.png'}
                  alt="Profile"
                  className="w-full h-full object-cover"
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
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
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
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;