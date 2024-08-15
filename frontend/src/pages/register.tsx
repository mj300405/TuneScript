import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import Layout from '../components/Layout';
import Link from 'next/link';

const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      user {
        id
        username
      }
    }
  }
`;

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, { loading }] = useMutation(REGISTER_MUTATION);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ variables: { username, email, password } });
      setStatus('Registration successful! Please check your email to confirm your account.');
      // Clear form fields after successful registration
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error(err);
      setStatus('Registration failed. Please try again.');
    }
  };

  return (
    <Layout title="Register">
      <div className="max-w-md mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">Register</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 mb-4 w-full rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'Loading...' : 'Register'}
          </button>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-blue-500 hover:underline">
              Already have an account? Login
            </Link>
          </div>
          {status && <p className={`mt-4 ${status.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>{status}</p>}
        </form>
      </div>
    </Layout>
  );
}