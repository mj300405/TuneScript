import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { gql, useMutation } from '@apollo/client';
import Layout from '../../../components/Layout';

export const CONFIRM_EMAIL = gql`
  mutation ConfirmEmail($uid: String!, $token: String!) {
    confirmEmail(uid: $uid, token: $token) {
      success
    }
  }
`;

const ConfirmEmail = () => {
  const router = useRouter();
  const { uid, token } = router.query;
  const [confirmEmail] = useMutation(CONFIRM_EMAIL);
  const [status, setStatus] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmailWrapper = async () => {
      if (uid && token && typeof uid === 'string' && typeof token === 'string') {
        try {
          const { data } = await confirmEmail({ variables: { uid, token } });
          if (data && data.confirmEmail && data.confirmEmail.success) {
            setStatus('Email confirmed successfully! You can now log in.');
          } else {
            setStatus('Email confirmation failed. The link may be invalid or expired.');
          }
        } catch (error) {
          setStatus('An error occurred while confirming your email.');
          console.error(error);
        }
      } else {
        setStatus('Invalid confirmation link. Please check your email for the correct link.');
      }
    };

    confirmEmailWrapper();
  }, [uid, token, confirmEmail]);

  return (
    <Layout title="Confirm Email">
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Email Confirmation</h1>
        <p className="text-center">{status}</p>
      </div>
    </Layout>
  );
};

export default ConfirmEmail;