// src/components/TranscriptionDetails.tsx
import React, { useState, useRef, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import dynamic from 'next/dynamic';

const PDF = dynamic(() => import('react-pdf-js'), {
  ssr: false,
});

const GET_TRANSCRIPTION_DETAILS = gql`
  query GetTranscriptionDetails($id: Int!) {
    transcription(id: $id) {
      id
      title
      composer
      player
      genre
      visibility
      status
      rating
      createdAt
      midiFile {
        downloadUrl
      }
      sheetMusic {
        downloadUrl
      }
      audioFile {
        audioFile
      }
    }
  }
`;

interface TranscriptionDetailsProps {
  transcriptionId: string | number;
  onClose: () => void;
}

const TranscriptionDetails: React.FC<TranscriptionDetailsProps> = ({ transcriptionId, onClose }) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { loading, error, data } = useQuery(GET_TRANSCRIPTION_DETAILS, {
    variables: { id: parseInt(transcriptionId as string, 10) },
  });

  function onDocumentComplete(pages: number) {
    setNumPages(pages);
    setPageNumber(1);
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const transcription = data?.transcription;

  if (!transcription) return <div>Transcription not found</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{transcription.title}</h2>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <p><strong>Composer:</strong> {transcription.composer}</p>
          <p><strong>Player:</strong> {transcription.player}</p>
          <p><strong>Genre:</strong> {transcription.genre}</p>
          <p><strong>Visibility:</strong> {transcription.visibility}</p>
          <p><strong>Status:</strong> {transcription.status}</p>
          <p><strong>Rating:</strong> {transcription.rating.toFixed(1)}</p>
          <p><strong>Created At:</strong> {new Date(transcription.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="mb-4 flex space-x-4">
          {transcription.midiFile?.downloadUrl && (
            <a 
              href={transcription.midiFile.downloadUrl}
              className="bg-blue-500 text-white px-4 py-2 rounded inline-block hover:bg-blue-600"
              download
            >
              Download MIDI
            </a>
          )}
          {transcription.sheetMusic?.downloadUrl && (
            <>
              <a 
                href={transcription.sheetMusic.downloadUrl}
                className="bg-green-500 text-white px-4 py-2 rounded inline-block hover:bg-green-600"
                download
              >
                Download PDF
              </a>
              <button
                onClick={() => setShowPdfPreview(!showPdfPreview)}
                className="bg-yellow-500 text-white px-4 py-2 rounded inline-block hover:bg-yellow-600"
              >
                {showPdfPreview ? 'Hide PDF Preview' : 'Show PDF Preview'}
              </button>
            </>
          )}
          {transcription.audioFile?.audioFile && (
            <button
              onClick={handlePlayPause}
              className="bg-purple-500 text-white px-4 py-2 rounded inline-block hover:bg-purple-600"
            >
              {isPlaying ? 'Pause Preview' : 'Play Preview'}
            </button>
          )}
        </div>
        {showPdfPreview && transcription.sheetMusic?.downloadUrl && (
          <div className="mt-4">
            <PDF
              file={transcription.sheetMusic.downloadUrl}
              onDocumentComplete={onDocumentComplete}
              page={pageNumber}
            />
            <p className="text-center mt-2">
              Page {pageNumber} of {numPages}
            </p>
            {numPages && numPages > 1 && (
              <div className="flex justify-center mt-2">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(pageNumber - 1)}
                  className="bg-blue-500 text-white px-2 py-1 rounded mr-2 disabled:bg-gray-300"
                >
                  Previous
                </button>
                <button
                  disabled={pageNumber >= (numPages || 0)}
                  onClick={() => setPageNumber(pageNumber + 1)}
                  className="bg-blue-500 text-white px-2 py-1 rounded disabled:bg-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
        >
          Close
        </button>
        {transcription.audioFile?.audioFile && (
          <audio
            ref={audioRef}
            src={`/media/${transcription.audioFile.audioFile}`}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
};

export default TranscriptionDetails;