// src/pages/upload.tsx
import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const UPLOAD_AUDIO_FILE = gql`
  mutation UploadAudioFile($title: String!, $audioFile: Upload!) {
    uploadAudioFile(title: $title, audioFile: $audioFile) {
      audioFile {
        id
        title
      }
    }
  }
`;

const CREATE_TRANSCRIPTION = gql`
  mutation CreateTranscription($audioFileId: Int!, $title: String!) {
    createTranscription(audioFileId: $audioFileId, title: $title) {
      transcription {
        id
        title
        status
      }
    }
  }
`;

export default function Upload() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadAudioFile] = useMutation(UPLOAD_AUDIO_FILE);
  const [createTranscription] = useMutation(CREATE_TRANSCRIPTION);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      const response = await uploadAudioFile({ variables: { title, audioFile: file } });
      const audioFileId = response.data.uploadAudioFile.audioFile.id;
      await createTranscription({ variables: { audioFileId, title } });
      router.push('/');
    }
  };

  return (
    <Layout title="Upload Audio">
      <div className="max-w-md mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">Upload Audio</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 mb-4 w-full rounded"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="border p-2 mb-4 w-full rounded"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded">
            Upload
          </button>
        </form>
      </div>
    </Layout>
  );
}
