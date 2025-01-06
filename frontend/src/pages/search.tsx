import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import Layout from '../components/Layout';
import TranscriptionDetails from '../components/TranscriptionDetails';

const GET_TRANSCRIPTIONS = gql`
  query GetTranscriptions($title: String, $composer: String, $tag: String, $player: String, $minRating: Float, $visibility: String) {
    transcriptions(title: $title, composer: $composer, tag: $tag, player: $player, minRating: $minRating, visibility: $visibility) {
      id
      title
      composer
      tags {
        id
        name
      }
      player
      visibility
      avgRating
      userRating
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
  tags: Tag[];
  player: string;
  visibility: string;
  avgRating: number;
  userRating: number | null;
  numRatings: number;
}

const Search = () => {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [tag, setTag] = useState('');
  const [player, setPlayer] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [visibility, setVisibility] = useState('');
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_TRANSCRIPTIONS, {
    variables: { title, composer, tag, player, minRating, visibility },
    fetchPolicy: 'network-only',
  });

  const handleSearch = () => {
    refetch({ title, composer, tag, player, minRating, visibility });
  };

  const handleDeleteTranscription = () => {
    refetch(); // Refetch the transcriptions list after deletion
  };

  return (
    <Layout title="Search Transcriptions">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Advanced Search</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Composer"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Player"
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Minimum Rating"
            value={minRating || ''}
            onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : null)}
            className="border p-2 rounded"
            min="0"
            max="5"
            step="0.1"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <button
          onClick={handleSearch}
          className="w-full bg-blue-500 text-white p-2 rounded mb-4"
        >
          Search
        </button>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error.message}</p>}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.transcriptions.map((transcription: Transcription) => (
              <div key={transcription.id} className="border p-4 rounded shadow">
                <h2 className="text-xl font-bold">{transcription.title}</h2>
                <p>Composer: {transcription.composer}</p>
                <p>Tags: 
                  {transcription.tags.map(tag => (
                    <span key={tag.id} className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                      {tag.name}
                    </span>
                  ))}
                </p>
                <p>Player: {transcription.player}</p>
                <p>Visibility: {transcription.visibility}</p>
                <p>Average Rating: {transcription.avgRating ? transcription.avgRating.toFixed(1) : 'No ratings'}</p>
                <p>Your Rating: {transcription.userRating ? transcription.userRating.toFixed(1) : 'Not rated'}</p>
                <p>Number of Ratings: {transcription.numRatings}</p>
                <button
                  onClick={() => setSelectedTranscription(transcription.id)}
                  className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
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

export default Search;