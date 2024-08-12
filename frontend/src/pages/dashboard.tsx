// src/pages/dashboard.tsx
import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import Layout from '../components/Layout';
import TranscriptionDetails from '../components/TranscriptionDetails';

const GET_DASHBOARD_DATA = gql`
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
    userMostPlayedTranscriptions {
      id
      title
      composer
      playCount
    }
    recommendedTranscriptions {
      id
      title
      composer
      genre
    }
    userStatistics {
      totalTranscriptions
      averageRating
      totalPlayTime
    }
  }
`;

const Dashboard = () => {
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const { loading, error, data } = useQuery(GET_DASHBOARD_DATA);

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
              {data?.highestRatedTranscriptions?.map((t: any) => (
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
              {data?.recentTranscriptions?.map((t: any) => (
                <li key={t.id} className="mb-2">
                  <button 
                    onClick={() => setSelectedTranscription(t.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {t.title} by {t.composer} - {new Date(t.createdAt).toLocaleDateString()}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* User's Most Played Transcriptions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Your Most Played</h2>
            <ul>
              {data?.userMostPlayedTranscriptions?.map((t: any) => (
                <li key={t.id} className="mb-2">
                  <button 
                    onClick={() => setSelectedTranscription(t.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {t.title} by {t.composer} - Played {t.playCount} times
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Transcriptions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Recommended for You</h2>
            <ul>
              {data?.recommendedTranscriptions?.map((t: any) => (
                <li key={t.id} className="mb-2">
                  <button 
                    onClick={() => setSelectedTranscription(t.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {t.title} by {t.composer} - {t.genre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* User Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Your Statistics</h2>
            <p>Total Transcriptions: {data?.userStatistics?.totalTranscriptions}</p>
            <p>Average Rating: {data?.userStatistics?.averageRating?.toFixed(2)}</p>
            <p>Total Play Time: {Math.floor((data?.userStatistics?.totalPlayTime || 0) / 3600)} hours</p>
          </div>
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

export default Dashboard;