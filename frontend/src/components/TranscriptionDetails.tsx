import React, { useState, useRef, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import RatingComponent from './RatingComponent';

// Set the workerSrc to the correct path
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const GET_TRANSCRIPTION_DETAILS = gql`
  query GetTranscriptionDetails($id: ID!) {
    transcription(id: $id) {
      id
      title
      composer
      player
      genre
      visibility
      status
      avgRating
      userRating
      numRatings
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

const RATE_TRANSCRIPTION = gql`
  mutation RateTranscription($transcriptionId: ID!, $ratingValue: Int!, $comment: String) {
    rateTranscription(transcriptionId: $transcriptionId, ratingValue: $ratingValue, comment: $comment) {
      rating {
        id
        rating
        comment
      }
      transcription {
        id
        avgRating
        numRatings
      }
    }
  }
`;

interface TranscriptionDetailsProps {
  transcriptionId: string;
  onClose: () => void;
}

const TranscriptionDetails: React.FC<TranscriptionDetailsProps> = ({ transcriptionId, onClose }) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { loading, error, data, refetch } = useQuery(GET_TRANSCRIPTION_DETAILS, {
    variables: { id: transcriptionId },
  });

  const [rateTranscription] = useMutation(RATE_TRANSCRIPTION);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(e => {
          console.error("Error playing audio:", e);
          setAudioError(e.message);
        });
        setIsPlaying(true);
      }
    }
  };

  const handleRatingChange = async (newRating: number, newComment: string | null) => {
    try {
      await rateTranscription({
        variables: {
          transcriptionId,
          ratingValue: newRating,
          comment: newComment,
        },
      });
      refetch();
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  useEffect(() => {
    if (data?.transcription?.audioFile?.audioFile) {
      const audioUrl = `/media/${data.transcription.audioFile.audioFile}`;
      console.log("Audio URL:", audioUrl);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    }
  }, [data]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage);
  };

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
          <p><strong>Average Rating:</strong> {transcription.avgRating.toFixed(1)} ({transcription.numRatings} ratings)</p>
          <p><strong>Created At:</strong> {new Date(transcription.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="mb-4">
          <RatingComponent
            transcriptionId={transcriptionId}
            initialRating={transcription.userRating}
            averageRating={transcription.avgRating}
            numRatings={transcription.numRatings}
            onRatingChange={handleRatingChange}
          />
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
        {audioError && <p className="text-red-500 mb-4">Error playing audio: {audioError}</p>}
        {showPdfPreview && transcription.sheetMusic?.downloadUrl && (
          <div className="mt-4">
            <Document
              file={transcription.sheetMusic.downloadUrl}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <Page pageNumber={pageNumber} />
            </Document>
            <p className="text-center mt-2">
              Page {pageNumber} of {numPages}
            </p>
            {numPages && numPages > 1 && (
              <div className="flex justify-center mt-2">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => handlePageChange(pageNumber - 1)}
                  className="bg-blue-500 text-white px-2 py-1 rounded mr-2 disabled:bg-gray-300"
                >
                  Previous
                </button>
                <button
                  disabled={pageNumber >= numPages}
                  onClick={() => handlePageChange(pageNumber + 1)}
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
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default TranscriptionDetails;
