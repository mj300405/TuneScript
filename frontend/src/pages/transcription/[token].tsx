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
      tags {
        id
        name
      }
      avgRating
      numRatings
    }
  }
`;

interface Tag {
  id: string;
  name: string;
}

interface Transcription {
  id: string;
  title: string;
  composer: string;
  player: string;
  tags: Tag[];
  avgRating: number;
  numRatings: number;
}

const SharedTranscriptionPage = () => {
  const router = useRouter();
  const { token } = router.query;

  const { loading, error, data } = useQuery(GET_TRANSCRIPTION_BY_SHARE_TOKEN, {
    variables: { token },
    skip: !token,
  });

  if (loading) return <Layout title="Shared Transcription"><p>Loading...</p></Layout>;
  if (error) return <Layout title="Shared Transcription"><p>Error: {error.message}</p></Layout>;

  const transcription: Transcription | null = data?.transcriptionByShareToken;

  if (!transcription) {
    return (
      <Layout title="Shared Transcription">
        <p>This transcription doesn't exist or is not shared publicly.</p>
      </Layout>
    );
  }

  return (
    <Layout title={`Shared: ${transcription.title}`}>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">{transcription.title}</h1>
        <p><strong>Composer:</strong> {transcription.composer}</p>
        <p><strong>Player:</strong> {transcription.player}</p>
        <p><strong>Tags:</strong> 
          {transcription.tags.map(tag => (
            <span key={tag.id} className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
              {tag.name}
            </span>
          ))}
        </p>
        <p><strong>Average Rating:</strong> {transcription.avgRating.toFixed(1)} ({transcription.numRatings} ratings)</p>
        <TranscriptionDetails 
          transcriptionId={transcription.id} 
          onClose={() => router.push('/')}
          onDelete={() => {}} // No-op for shared view
        />
      </div>
    </Layout>
  );
};

export default SharedTranscriptionPage;