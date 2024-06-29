// src/pages/search.tsx
import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import Layout from '../components/Layout';

const GET_TRANSCRIPTIONS = gql`
  query GetTranscriptions($title: String, $composer: String, $visibility: String) {
    transcriptions(title: $title, composer: $composer, visibility: $visibility) {
      id
      title
      composer
      visibility
    }
  }
`;

interface Transcription {
  id: string;
  title: string;
  composer: string;
  visibility: string;
}

const Search = () => {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [visibility, setVisibility] = useState('');
  const { data, loading, error, refetch } = useQuery(GET_TRANSCRIPTIONS, {
    variables: { title, composer, visibility }
  });

  const handleSearch = () => {
    refetch({ title, composer, visibility });
  };

  return (
    <Layout title="Search Transcriptions">
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Search Transcriptions</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 mb-2 w-full rounded"
          />
          <input
            type="text"
            placeholder="Composer"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            className="border p-2 mb-2 w-full rounded"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="border p-2 mb-2 w-full rounded"
          >
            <option value="">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button onClick={handleSearch} className="bg-blue-500 text-white p-2 w-full rounded">
            Search
          </button>
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error.message}</p>}
        {data && (
          <div>
            {data.transcriptions.map((transcription: Transcription) => (
              <div key={transcription.id} className="border p-2 mb-2 rounded">
                <p>Title: {transcription.title}</p>
                <p>Composer: {transcription.composer}</p>
                <p>Visibility: {transcription.visibility}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
