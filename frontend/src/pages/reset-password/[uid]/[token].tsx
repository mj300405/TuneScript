import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';

const PASSWORD_CHANGE_MUTATION = gql`
  mutation PasswordChange($uid: String!, $token: String!, $newPassword: String!) {
    passwordChange(uid: $uid, token: $token, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export default function PasswordReset() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordChange, { loading }] = useMutation(PASSWORD_CHANGE_MUTATION);
  const router = useRouter();
  const { uid, token } = router.query;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setIsSuccess(false);
      return;
    }
    if (!uid || !token) {
      setMessage('Invalid reset link. Please request a new password reset.');
      setIsSuccess(false);
      return;
    }
    try {
      const { data } = await passwordChange({
        variables: { uid: uid as string, token: token as string, newPassword: password },
      });
      if (data.passwordChange.success) {
        setMessage('Password successfully changed. Redirecting to login...');
        setIsSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setMessage(data.passwordChange.message);
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      setIsSuccess(false);
    }
  };

  return (
    <Layout title="Set New Password">
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Set New Password</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="New password"
            required
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className="w-full p-2 mb-4 border rounded"
          />
          <button
            type="submit"
            disabled={loading || !uid || !token}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-center ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
            {message}
          </p>
        )}
      </div>
    </Layout>
  );
}