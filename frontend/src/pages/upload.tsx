import { useState, useEffect } from 'react';
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
        status
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
  const [transcriptionId, setTranscriptionId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [transcriptionDetails, setTranscriptionDetails] = useState<any>(null);

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

    try {
      setButtonDisabled(true);
      setStatusMessage('Uploading audio file...');
      const { data: uploadData } = await uploadAudioFile({
        variables: { title, file: audioFile },
      });
      const audioFileId = parseInt(uploadData.uploadAudioFile.audioFile.id, 10);

      setStatusMessage('Creating transcription...');
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

      setTranscriptionId(parseInt(transcriptionData.createTranscription.transcription.id, 10));
      setStatusMessage('Transcription started. Awaiting status update...');
      // Clear form
      setTitle('');
      setGenre('');
      setComposer('');
      setPlayer('');
      setIsPublic(true);
      setAudioFile(null);
    } catch (err) {
      console.error('Upload or transcription creation failed:', err);
      setButtonDisabled(false);
      alert('Failed to upload the audio file or create the transcription.');
    }
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;

    if (transcriptionId) {
      const sseUrl = `/api/sse-stream/${transcriptionId}`;
      console.log('Connecting to SSE:', sseUrl);
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received SSE data:', data);
          setStatusMessage(`Transcription Status: ${data.status}`);
          setTranscriptionDetails(data);

          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            setButtonDisabled(false);
            eventSource?.close();
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        setStatusMessage('Lost connection. Retrying...');
        eventSource?.close();
        // Attempt to reconnect after a short delay
        setTimeout(() => {
          setTranscriptionId(null);
          setTranscriptionId(transcriptionId);
        }, 5000);
      };

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setStatusMessage('Connected. Waiting for updates...');
      };
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [transcriptionId]);

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
          {transcriptionDetails && transcriptionDetails.status === 'COMPLETED' && (
            <div className="mt-4 p-4 border rounded bg-green-50">
              <h2 className="text-xl font-bold mb-2">Transcription Completed</h2>
              <p><strong>Title:</strong> {transcriptionDetails.title}</p>
              <p><strong>Audio File:</strong> {transcriptionDetails.audio_file_name}</p>
              <div className="mt-2">
                {transcriptionDetails.midi_file_url && (
                  <a 
                    href={transcriptionDetails.midi_file_url} 
                    className="bg-blue-500 text-white px-4 py-2 rounded inline-block mr-2 hover:bg-blue-600" 
                    download
                  >
                    Download MIDI
                  </a>
                )}
                {transcriptionDetails.sheet_music_url && (
                  <a 
                    href={transcriptionDetails.sheet_music_url} 
                    className="bg-green-500 text-white px-4 py-2 rounded inline-block hover:bg-green-600" 
                    download
                  >
                    Download Sheet Music
                  </a>
                )}
              </div>
            </div>
          )}
          {transcriptionDetails && transcriptionDetails.status === 'FAILED' && (
            <div className="mt-4 p-4 border rounded bg-red-50">
              <h2 className="text-xl font-bold mb-2 text-red-600">Transcription Failed</h2>
              <p>{transcriptionDetails.message}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Upload;