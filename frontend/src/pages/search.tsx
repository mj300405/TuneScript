// src/pages/search.tsx
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import Layout from '../components/Layout';
import { SEARCH_TRANSCRIPTIONS } from '../lib/queries';

const Search = () => {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [visibility, setVisibility] = useState('');
  const { loading, error, data } = useQuery(SEARCH_TRANSCRIPTIONS, {
    variables: { title, composer, visibility },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // This will trigger the useQuery hook with the new variables
  };

  return (
    <Layout title="Search Transcriptions">
      <div className="max-w-md mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">Search Transcriptions</h1>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 mb-4 w-full rounded"
          />
          <input
            type="text"
            placeholder="Composer"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            className="border p-2 mb-4 w-full rounded"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="border p-2 mb-4 w-full rounded"
          >
            <option value="">All</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
          <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
            Search
          </button>
        </form>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error.message}</p>}
        {data && (
          <div className="mt-4">
            {data.transcriptions.map((transcription: any) => (
              <div key={transcription.id} className="border-b py-2">
                <h2 className="text-xl font-bold">{transcription.title}</h2>
                <p>Composer: {transcription.composer}</p>
                <p>Visibility: {transcription.visibility}</p>
                <p>Rating: {transcription.rating}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
