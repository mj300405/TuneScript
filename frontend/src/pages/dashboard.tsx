import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import Layout from '../components/Layout';
import TranscriptionDetails from '../components/TranscriptionDetails';
import Link from 'next/link';

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    highestRatedTranscriptions {
      id
      title
      composer
      avgRating
    }
    recentTranscriptions {
      id
      title
      composer
      createdAt
    }
    recommendedTranscriptions {
      id
      title
      composer
      tags {
        id
        name
      }
    }
    userStatistics {
      totalTranscriptions
      averageRating
      totalPlayTime
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
  avgRating?: number;
  createdAt?: string;
  tags?: Tag[];
}

const Dashboard = () => {
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const { loading, error, data, refetch } = useQuery(GET_DASHBOARD_DATA);

  const handleDeleteTranscription = () => {
    refetch(); // Refetch the dashboard data after deletion
    setSelectedTranscription(null);
  };

  if (loading) return <Layout title="Dashboard"><p>Loading...</p></Layout>;
  if (error) return <Layout title="Dashboard"><p>Error: {error.message}</p></Layout>;

  return (
    <Layout title="Dashboard">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Highest Rated Transcriptions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Highest Rated Transcriptions</h2>
            <ul>
              {data?.highestRatedTranscriptions?.map((t: Transcription) => (
                <li key={t.id} className="mb-2">
                  <button 
                    onClick={() => setSelectedTranscription(t.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {t.title} by {t.composer} - Rating: {t.avgRating?.toFixed(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Recently Added Transcriptions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Recently Added</h2>
            <ul>
              {data?.recentTranscriptions?.map((t: Transcription) => (
                <li key={t.id} className="mb-2">
                  <button 
                    onClick={() => setSelectedTranscription(t.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {t.title} by {t.composer} - {new Date(t.createdAt || '').toLocaleDateString()}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Transcriptions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Recommended for You</h2>
            {data?.recommendedTranscriptions?.length > 0 ? (
              <ul>
                {data.recommendedTranscriptions.map((t: Transcription) => (
                  <li key={t.id} className="mb-2">
                    <button 
                      onClick={() => setSelectedTranscription(t.id)}
                      className="text-blue-600 hover:underline"
                    >
                      {t.title} by {t.composer} - 
                      {t.tags?.map(tag => (
                        <span key={tag.id} className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                          {tag.name}
                        </span>
                      ))}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No recommendations available at the moment.</p>
            )}
          </div>

          {/* User Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Your Statistics</h2>
            <p>Total Transcriptions: {data?.userStatistics?.totalTranscriptions || 0}</p>
            <p>Average Rating: {data?.userStatistics?.averageRating?.toFixed(2) || 'N/A'}</p>
            <p>Total Play Time: {Math.floor((data?.userStatistics?.totalPlayTime || 0) / 3600)} hours</p>
            {data?.userStatistics?.totalTranscriptions === 0 && (
              <p className="mt-4 text-gray-500">Start exploring to see your statistics grow!</p>
            )}
          </div>
        </div>

        {selectedTranscription && (
          <TranscriptionDetails
            transcriptionId={selectedTranscription}
            onClose={() => setSelectedTranscription(null)}
            onDelete={handleDeleteTranscription}
          />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;