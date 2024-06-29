// src/pages/upload.tsx
import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import Layout from '../components/Layout';

const UPLOAD_AUDIO_FILE = gql`
  mutation UploadAudioFile($title: String!, $file: Upload!) {
    uploadAudioFile(title: $title, file: $file) {
      audioFile {
        id
        title
      }
    }
  }
`;

const CREATE_TRANSCRIPTION = gql`
  mutation CreateTranscription($audioFileId: Int!, $title: String!, $genre: String, $composer: String, $player: String, $isPublic: Boolean!) {
    createTranscription(audioFileId: $audioFileId, title: $title, genre: $genre, composer: $composer, player: $player, isPublic: $isPublic) {
      transcription {
        id
        title
      }
    }
  }
`;

const Upload = () => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [composer, setComposer] = useState('');
  const [player, setPlayer] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [uploadAudioFile] = useMutation(UPLOAD_AUDIO_FILE);
  const [createTranscription] = useMutation(CREATE_TRANSCRIPTION);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleUpload = async () => {
    if (!audioFile) {
      alert('Please select an audio file.');
      return;
    }

    setLoading(true);

    try {
      const { data: uploadData } = await uploadAudioFile({
        variables: { title, file: audioFile },
      });

      if (!uploadData || !uploadData.uploadAudioFile) {
        throw new Error('File upload failed.');
      }

      const audioFileId = parseInt(uploadData.uploadAudioFile.audioFile.id, 10);

      const { data: transcriptionData } = await createTranscription({
        variables: {
          audioFileId,
          title,
          genre,
          composer,
          player,
          isPublic,
        },
      });

      if (!transcriptionData || !transcriptionData.createTranscription) {
        throw new Error('Transcription creation failed.');
      }

      alert('Transcription created successfully!');
    } catch (err) {
      console.error('Upload or transcription creation failed:', err);
      alert('Failed to upload the audio file or create the transcription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Upload Audio">
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Upload Audio</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 mb-2 w-full rounded"
          />
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioFileChange}
            className="border p-2 mb-2 w-full rounded"
          />
          <input
            type="text"
            placeholder="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="border p-2 mb-2 w-full rounded"
          />
          <input
            type="text"
            placeholder="Composer"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            className="border p-2 mb-2 w-full rounded"
          />
          <input
            type="text"
            placeholder="Player"
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            className="border p-2 mb-2 w-full rounded"
          />
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={() => setIsPublic(!isPublic)}
            />
            Public
          </label>
          <button
            onClick={handleUpload}
            className="bg-blue-500 text-white p-2 w-full rounded"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload and Create Transcription'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Upload;
