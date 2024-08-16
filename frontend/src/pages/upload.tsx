import React, { useState, useEffect, useRef } from 'react';
import { gql, useMutation } from '@apollo/client';
import Layout from '../components/Layout';
import { fromGlobalId } from 'graphql-relay';
import TranscriptionDetails from '../components/TranscriptionDetails';

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
  mutation CreateTranscription($audioFileId: Int, $youtubeUrl: String, $title: String!, $genre: String, $composer: String, $player: String, $isPublic: Boolean!) {
    createTranscription(audioFileId: $audioFileId, youtubeUrl: $youtubeUrl, title: $title, genre: $genre, composer: $composer, player: $player, isPublic: $isPublic) {
      transcription {
        id
        title
        composer
        genre
        player
        visibility
        status
        audioFile {
          id
          title
        }
      }
    }
  }
`;

const Upload: React.FC = () => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [composer, setComposer] = useState('');
  const [player, setPlayer] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [showTranscriptionDetails, setShowTranscriptionDetails] = useState(false);
  const [sseError, setSseError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [uploadAudioFile] = useMutation(UPLOAD_AUDIO_FILE);
  const [createTranscription] = useMutation(CREATE_TRANSCRIPTION);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setYoutubeUrl('');  // Clear YouTube URL when file is selected
    }
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
    setAudioFile(null);  // Clear audio file when YouTube URL is entered
  };

  const initSSEConnection = (transcriptionId: string) => {
    const sseUrl = `/api/sse-stream/${encodeURIComponent(transcriptionId)}`;
    console.log('Connecting to SSE:', sseUrl);
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received SSE data:', data);
        setStatusMessage(`Transcription Status: ${data.status}`);

        if (data.status === 'COMPLETED') {
          setShowTranscriptionDetails(true);
          setButtonDisabled(false);
          eventSource.close();
        } else if (data.status === 'FAILED') {
          setStatusMessage(`Transcription failed: ${data.message}`);
          setButtonDisabled(false);
          eventSource.close();
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setSseError('Lost connection. Retrying...');
      eventSource.close();
      // Attempt to reconnect after a short delay
      setTimeout(() => initSSEConnection(transcriptionId), 5000);
    };

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setStatusMessage('Connected. Waiting for updates...');
    };

    eventSourceRef.current = eventSource;
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleUpload = async () => {
    if (!audioFile && !youtubeUrl) {
      alert('Please select an audio file or enter a YouTube URL.');
      return;
    }

    try {
      setButtonDisabled(true);
      setStatusMessage('Processing...');

      let audioFileId: number | null = null;

      if (audioFile) {
        setStatusMessage('Uploading audio file...');
        const { data: uploadData } = await uploadAudioFile({
          variables: { title, file: audioFile },
        });

        console.log('Upload response:', uploadData);

        if (!uploadData || !uploadData.uploadAudioFile || !uploadData.uploadAudioFile.audioFile) {
          throw new Error('Invalid upload response');
        }

        audioFileId = parseInt(fromGlobalId(uploadData.uploadAudioFile.audioFile.id).id);
      }

      setStatusMessage('Creating transcription...');
      const { data: transcriptionData } = await createTranscription({
        variables: {
          audioFileId,
          youtubeUrl: youtubeUrl || null,
          title,
          genre,
          composer,
          player,
          isPublic,
        },
      });

      console.log('Transcription response:', transcriptionData);

      if (!transcriptionData || !transcriptionData.createTranscription || !transcriptionData.createTranscription.transcription) {
        throw new Error('Invalid transcription response');
      }

      const newTranscriptionId = transcriptionData.createTranscription.transcription.id;
      setTranscriptionId(newTranscriptionId);
      setStatusMessage('Transcription started. Awaiting status update...');
      
      // Initialize SSE connection
      initSSEConnection(newTranscriptionId);

      // Clear form
      setTitle('');
      setGenre('');
      setComposer('');
      setPlayer('');
      setIsPublic(true);
      setAudioFile(null);
      setYoutubeUrl('');
    } catch (error: unknown) {
      console.error('Upload or transcription creation failed:', error);
      setButtonDisabled(false);
      if (error instanceof Error) {
        alert(`Failed to upload the audio file or create the transcription: ${error.message}`);
      } else {
        alert('An unknown error occurred during upload or transcription creation.');
      }
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
            disabled={!!youtubeUrl}
          />
          <input
            type="text"
            placeholder="YouTube URL"
            value={youtubeUrl}
            onChange={handleYoutubeUrlChange}
            className="border p-2 mb-2 w-full rounded"
            disabled={!!audioFile}
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
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={() => setIsPublic(!isPublic)}
              className="mr-2"
            />
            Public
          </label>
          <button
            onClick={handleUpload}
            className="bg-blue-500 text-white p-2 w-full rounded disabled:bg-gray-400"
            disabled={buttonDisabled}
          >
            Upload and Create Transcription
          </button>
        </div>
        <div className="mt-4">
          <p>{statusMessage}</p>
          {sseError && <p className="text-red-500">{sseError}</p>}
        </div>
      </div>
      {showTranscriptionDetails && transcriptionId && (
        <TranscriptionDetails
          transcriptionId={transcriptionId}
          onClose={() => setShowTranscriptionDetails(false)}
        />
      )}
    </Layout>
  );
};

export default Upload;