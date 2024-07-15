// src/pages/my-transcriptions.tsx
import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import Layout from '../components/Layout';
import TranscriptionDetails from '../components/TranscriptionDetails';

const GET_MY_TRANSCRIPTIONS = gql`
  query GetMyTranscriptions {
    myTranscriptions {
      id
      title
      composer
      genre
      player
      rating
      visibility
      status
      createdAt
    }
  }
`;

const MyTranscriptions = () => {
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const { loading, error, data } = useQuery(GET_MY_TRANSCRIPTIONS);

  if (loading) return <Layout title="My Transcriptions"><p>Loading...</p></Layout>;
  if (error) return <Layout title="My Transcriptions"><p>Error: {error.message}</p></Layout>;

  return (
    <Layout title="My Transcriptions">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">My Transcriptions</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.myTranscriptions.map((transcription: any) => (
            <div key={transcription.id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-bold">{transcription.title}</h2>
              <p>Composer: {transcription.composer}</p>
              <p>Genre: {transcription.genre}</p>
              <p>Player: {transcription.player}</p>
              <p>Rating: {transcription.rating.toFixed(1)}</p>
              <p>Status: {transcription.status}</p>
              <p>Created: {new Date(transcription.createdAt).toLocaleDateString()}</p>
              <button
                onClick={() => setSelectedTranscription(transcription.id)}
                className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
        {selectedTranscription && (
          <TranscriptionDetails
            transcriptionId={selectedTranscription}
            onClose={() => setSelectedTranscription(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default MyTranscriptions;