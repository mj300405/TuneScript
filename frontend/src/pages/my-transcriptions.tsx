import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import Layout from '../components/Layout';
import TranscriptionDetails from '../components/TranscriptionDetails';

const GET_MY_TRANSCRIPTIONS = gql`
  query GetMyTranscriptions {
    myTranscriptions {
      id
      title
      composer
      genre
      status
      createdAt
    }
  }
`;

const MyTranscriptionsPage = () => {
  const { loading, error, data } = useQuery(GET_MY_TRANSCRIPTIONS);
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);

  if (loading) return <Layout title="My Transcriptions">Loading...</Layout>;
  if (error) return <Layout title="My Transcriptions">Error: {error.message}</Layout>;

  return (
    <Layout title="My Transcriptions">
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-6">My Transcriptions</h1>
        {data.myTranscriptions.length === 0 ? (
          <p>You don&apos;t have any transcriptions yet.</p>
        ) : (
          <ul className="space-y-4">
            {data.myTranscriptions.map((transcription: any) => (
              <li key={transcription.id} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{transcription.title}</h2>
                    <p className="text-gray-600">Composer: {transcription.composer}</p>
                    <p className="text-gray-600">Genre: {transcription.genre}</p>
                    <p className="text-sm text-gray-500">
                      Created on: {new Date(transcription.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-2 py-1 rounded text-sm ${
                      transcription.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                      transcription.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {transcription.status}
                    </span>
                    <button
                      onClick={() => setSelectedTranscription(transcription.id)}
                      className="mt-2 text-blue-600 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedTranscription && (
        <TranscriptionDetails
          transcriptionId={selectedTranscription}
          onClose={() => setSelectedTranscription(null)}
        />
      )}
    </Layout>
  );
};

export default MyTranscriptionsPage;