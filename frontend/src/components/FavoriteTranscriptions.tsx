import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import TranscriptionDetails from './TranscriptionDetails';
import Layout from './Layout';

export const GET_FAVORITE_TRANSCRIPTIONS = gql`
  query GetFavoriteTranscriptions {
    userFavorites {
      id
      title
      composer
      genre
      player
      visibility
      status
      createdAt
      avgRating
    }
  }
`;

interface FavoriteTranscriptionsProps {
  TranscriptionDetailsComponent?: React.ComponentType<any>;
  LayoutComponent?: React.ComponentType<any>;
}

const FavoriteTranscriptions: React.FC<FavoriteTranscriptionsProps> = ({
  TranscriptionDetailsComponent = TranscriptionDetails,
  LayoutComponent = Layout,
}) => {
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null);
  const { loading, error, data, refetch } = useQuery(GET_FAVORITE_TRANSCRIPTIONS);

  const handleTranscriptionClick = (id: string) => {
    setSelectedTranscriptionId(id);
  };

  const handleCloseDetails = () => {
    setSelectedTranscriptionId(null);
    refetch(); // Refetch the list to update any changes
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data || !data.userFavorites) return null; // Added check for undefined data

  return (
    <LayoutComponent title="Favorite Transcriptions">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Favorite Transcriptions</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.userFavorites.map((transcription: any) => (
            <div key={transcription.id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-bold">{transcription.title}</h2>
              <p>Composer: {transcription.composer}</p>
              <p>Genre: {transcription.genre}</p>
              <p>Player: {transcription.player}</p>
              <p>Visibility: {transcription.visibility}</p>
              <p>Status: {transcription.status}</p>
              <p>
                Average Rating:{' '}
                {transcription.avgRating ? transcription.avgRating.toFixed(1) : 'No ratings'}
              </p>
              <p>Created: {new Date(transcription.createdAt).toLocaleDateString()}</p>
              <button
                onClick={() => handleTranscriptionClick(transcription.id)}
                className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
        {selectedTranscriptionId && (
          <TranscriptionDetailsComponent
            transcriptionId={selectedTranscriptionId}
            onClose={handleCloseDetails}
            onDelete={() => {}} // We don't need delete functionality here
          />
        )}
      </div>
    </LayoutComponent>
  );
};

export default FavoriteTranscriptions;
