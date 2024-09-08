import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import Layout from '../components/Layout';

export const PASSWORD_RESET_MUTATION = gql`
  mutation PasswordReset($email: String!) {
    passwordReset(email: $email) {
      success
      message
    }
  }
`;

export default function PasswordResetRequest() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [passwordReset, { loading }] = useMutation(PASSWORD_RESET_MUTATION);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { data } = await passwordReset({ variables: { email } });
      setMessage(data.passwordReset.message);
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <Layout title="Reset Password">
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full p-2 mb-4 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Reset Password'}
          </button>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </Layout>
  );
}