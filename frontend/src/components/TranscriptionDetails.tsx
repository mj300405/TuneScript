import React, { useState, useRef, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import RatingComponent from './RatingComponent';
import ShareComponent from './ShareComponent';
import { FileMusic, FileText, Eye, EyeOff, Play, Pause, Trash2 } from 'lucide-react';

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
      isOwner
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

const DELETE_TRANSCRIPTION = gql`
  mutation DeleteTranscription($id: ID!) {
    deleteTranscription(id: $id) {
      success
    }
  }
`;

interface TranscriptionDetailsProps {
  transcriptionId: string;
  onClose: () => void;
  onDelete: () => void;
}

const TranscriptionDetails: React.FC<TranscriptionDetailsProps> = ({ transcriptionId, onClose, onDelete }) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [audioLoadingStatus, setAudioLoadingStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  const { loading, error, data, refetch } = useQuery(GET_TRANSCRIPTION_DETAILS, {
    variables: { id: transcriptionId },
  });

  const [rateTranscription] = useMutation(RATE_TRANSCRIPTION);
  const [deleteTranscription] = useMutation(DELETE_TRANSCRIPTION);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
    setPdfError(null);
  }

  function onDocumentLoadError(error: Error): void {
    console.error('Error loading PDF:', error);
    setPdfError('Failed to load PDF. Please try again later.');
  }

  const handlePlayPause = () => {
    if (audioRef.current && audioLoadingStatus === 'loaded') {
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

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transcription?')) {
      try {
        const { data } = await deleteTranscription({
          variables: { id: transcriptionId },
        });
        
        if (data.deleteTranscription.success) {
          alert('Transcription deleted successfully');
          onDelete(); // Call the onDelete prop to trigger refetch in parent component
          onClose(); // Close the modal
        } else {
          throw new Error('Deletion was not successful');
        }
      } catch (error) {
        console.error('Error deleting transcription:', error);
        alert('Failed to delete transcription');
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    let cleanup: (() => void) | undefined;

    const loadAudio = async () => {
      if (data?.transcription?.audioFile?.audioFile) {
        const audioUrl = `/media/${data.transcription.audioFile.audioFile}`;
        console.log("Audio URL:", audioUrl);

        try {
          const audio = new Audio(audioUrl);
          
          const handleLoadedData = () => {
            if (isMountedRef.current) {
              console.log('Audio loaded successfully');
              setAudioLoadingStatus('loaded');
            }
          };

          const handleError = (e: Event) => {
            if (isMountedRef.current) {
              console.error('Error loading audio:', e);
              setAudioLoadingStatus('error');
              setAudioError('Failed to load audio file');
            }
          };

          audio.addEventListener('loadeddata', handleLoadedData);
          audio.addEventListener('error', handleError);

          audioRef.current = audio;

          cleanup = () => {
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('error', handleError);
            audio.pause();
            audio.src = '';
          };
        } catch (error) {
          console.error('Unexpected error while setting up audio:', error);
          if (isMountedRef.current) {
            setAudioLoadingStatus('error');
            setAudioError('Unexpected error while setting up audio');
          }
        }
      }
    };

    loadAudio();

    return () => {
      isMountedRef.current = false;
      if (cleanup) cleanup();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [data]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
      };

      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const transcription = data?.transcription;

  if (!transcription) return <div>Transcription not found</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden relative flex flex-col">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold truncate">{transcription.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-grow p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <p><strong>Composer:</strong> {transcription.composer}</p>
            <p><strong>Player:</strong> {transcription.player || 'Unknown'}</p>
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
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              {transcription.midiFile?.downloadUrl && (
                <a 
                  href={transcription.midiFile.downloadUrl}
                  className="bg-blue-500 text-white p-2 rounded inline-flex items-center justify-center hover:bg-blue-600"
                  download
                  title="Download MIDI"
                >
                  <FileMusic size={24} />
                </a>
              )}
              {transcription.sheetMusic?.downloadUrl && (
                <a 
                  href={transcription.sheetMusic.downloadUrl}
                  className="bg-green-500 text-white p-2 rounded inline-flex items-center justify-center hover:bg-green-600"
                  download
                  title="Download PDF"
                >
                  <FileText size={24} />
                </a>
              )}
              {transcription.sheetMusic?.downloadUrl && (
                <button
                  onClick={() => setShowPdfPreview(!showPdfPreview)}
                  className="bg-yellow-500 text-white p-2 rounded inline-flex items-center justify-center hover:bg-yellow-600"
                  title={showPdfPreview ? "Hide PDF Preview" : "Show PDF Preview"}
                >
                  {showPdfPreview ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              )}
              {audioLoadingStatus === 'loaded' && (
                <button
                  onClick={handlePlayPause}
                  className="bg-purple-500 text-white p-2 rounded inline-flex items-center justify-center hover:bg-purple-600"
                  title={isPlaying ? "Pause Preview" : "Play Preview"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <ShareComponent transcriptionId={transcriptionId} />
              {transcription.isOwner && (
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white p-2 rounded inline-flex items-center justify-center hover:bg-red-600"
                  title="Delete Transcription"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
          </div>

          {audioLoadingStatus === 'error' && <p className="text-red-500 mt-4">Error with audio: {audioError}</p>}
          
          {showPdfPreview && transcription.sheetMusic?.downloadUrl && (
            <div className="mt-4 border-t pt-4">
              <Document
                file={transcription.sheetMusic.downloadUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div>Loading PDF...</div>}
                error={<div>Error loading PDF. Please try again.</div>}
              >
                {pdfError ? (
                  <div className="text-red-500">{pdfError}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Page 
                      pageNumber={pageNumber} 
                      scale={1}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      width={Math.min(600, window.innerWidth - 64)}
                    />
                  </div>
                )}
              </Document>
              {!pdfError && numPages > 0 && (
                <>
                  <p className="text-center mt-2">
                    Page {pageNumber} of {numPages}
                  </p>
                  {numPages > 1 && (
                    <div className="flex justify-center mt-2">
                      <button
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                        className="bg-blue-500 text-white px-2 py-1 rounded mr-2 disabled:bg-gray-300"
                      >
                        Previous
                      </button>
                      <button
                        disabled={pageNumber >= numPages}
                        onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                        className="bg-blue-500 text-white px-2 py-1 rounded disabled:bg-gray-300"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionDetails;