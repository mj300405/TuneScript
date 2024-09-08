import { useRouter } from 'next/router';
import { useQuery, gql } from '@apollo/client';
import Layout from '../../components/Layout';
import TranscriptionDetails from '../../components/TranscriptionDetails';

export const GET_TRANSCRIPTION_BY_SHARE_TOKEN = gql`
  query GetTranscriptionByShareToken($token: UUID!) {
    transcriptionByShareToken(token: $token) {
      id
      title
      composer
      player
      genre
      avgRating
      numRatings
    }
  }
`;

const SharedTranscriptionPage = () => {
  const router = useRouter();
  const { token } = router.query;

  const { loading, error, data } = useQuery(GET_TRANSCRIPTION_BY_SHARE_TOKEN, {
    variables: { token },
    skip: !token,
  });

  if (loading) return <Layout title="Shared Transcription"><p>Loading...</p></Layout>;
  if (error) return <Layout title="Shared Transcription"><p>Error: {error.message}</p></Layout>;

  const transcription = data?.transcriptionByShareToken;

  if (!transcription) {
    return (
      <Layout title="Shared Transcription">
        <p>This transcription doesn't exist or is not shared publicly.</p>
      </Layout>
    );
  }

  return (
    <Layout title={`Shared: ${transcription.title}`}>
      <TranscriptionDetails 
        transcriptionId={transcription.id} 
        onClose={() => router.push('/')}
        onDelete={() => {}} // No-op for shared view
      />
    </Layout>
  );
};

export default SharedTranscriptionPage;