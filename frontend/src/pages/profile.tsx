// src/pages/profile.tsx
import { useContext } from 'react';
import Layout from '../components/Layout';
import AuthContext from '../context/AuthContext';
import { gql, useQuery } from '@apollo/client';

const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      username
      email
    }
  }
`;

const Profile = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const { data, loading, error } = useQuery(GET_USER_PROFILE);

  if (!isAuthenticated) {
    return <Layout title="Profile">You need to log in to view this page.</Layout>;
  }

  if (loading) return <Layout title="Profile">Loading...</Layout>;
  if (error) return <Layout title="Profile">{error.message}</Layout>;

  return (
    <Layout title="Profile">
      <div className="max-w-md mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">Profile</h1>
        <p>Username: {data.me.username}</p>
        <p>Email: {data.me.email}</p>
      </div>
    </Layout>
  );
};

export default Profile;
