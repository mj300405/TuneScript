// src/pages/login.tsx
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const LOGIN_MUTATION = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
    }
  }
`;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [login, { data, loading, error }] = useMutation(LOGIN_MUTATION);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({ variables: { username, password } });
      localStorage.setItem('token', response.data.tokenAuth.token);
      router.push('/dashboard'); // Redirect to the dashboard or any other page
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout title="Login">
      <div className="max-w-md mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 mb-4 w-full rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 mb-4 w-full rounded"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
            {loading ? 'Loading...' : 'Login'}
          </button>
          {error && <p className="text-red-500 mt-4">{error.message}</p>}
        </form>
      </div>
    </Layout>
  );
}
