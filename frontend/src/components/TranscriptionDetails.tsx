import React, { useState, useRef, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import RatingComponent from './RatingComponent';

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

const UPDATE_PLAY_HISTORY = gql`
  mutation UpdatePlayHistory($transcriptionId: ID!, $playTime: Int!) {
    updatePlayHistory(transcriptionId: $transcriptionId, playTime: $playTime) {
      success
    }
  }
`;

interface TranscriptionDetailsProps {
  transcriptionId: string;
  onClose: () => void;
}

const TranscriptionDetails: React.FC<TranscriptionDetailsProps> = ({ transcriptionId, onClose }) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playStartTimeRef = useRef<number | null>(null);

  const { loading, error, data, refetch } = useQuery(GET_TRANSCRIPTION_DETAILS, {
    variables: { id: transcriptionId },
  });

  const [rateTranscription] = useMutation(RATE_TRANSCRIPTION);
  const [updatePlayHistory] = useMutation(UPDATE_PLAY_HISTORY);

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
    if (audioRef.current) {
      if (isPlaying) {
        console.log('Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
        if (playStartTimeRef.current !== null) {
          const playTime = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
          updatePlayHistory({
            variables: {
              transcriptionId,
              playTime: Math.max(playTime, 1),
            },
          });
          playStartTimeRef.current = null;
        }
      } else {
        console.log('Playing audio');
        audioRef.current.play().then(() => {
          console.log('Audio playback started successfully');
          setIsPlaying(true);
          playStartTimeRef.current = Date.now();
        }).catch(e => {
          console.error("Error playing audio:", e);
          setAudioError(e.message);
        });
      }
    } else {
      console.error('Audio element not found');
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
      
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadeddata', () => {
        console.log('Audio loaded successfully');
        setIsAudioLoaded(true);
      });
      audio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
        setAudioError('Failed to load audio file');
      });
      audioRef.current = audio;

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [data]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        console.log('Audio playback ended');
        setIsPlaying(false);
        if (playStartTimeRef.current !== null) {
          const playTime = Math.floor((Date.now() - playStartTimeRef.current) / 1000);
          updatePlayHistory({
            variables: {
              transcriptionId,
              playTime: Math.max(playTime, 1),
            },
          });
          playStartTimeRef.current = null;
        }
      };

      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [transcriptionId, updatePlayHistory]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const transcription = data?.transcription;

  if (!transcription) return <div>Transcription not found</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold truncate">{transcription.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          <div className="p-4">
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
            <div className="mb-4 flex flex-wrap gap-2">
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
              {isAudioLoaded && (
                <button
                  onClick={handlePlayPause}
                  className="bg-purple-500 text-white px-4 py-2 rounded inline-block hover:bg-purple-600"
                >
                  {isPlaying ? 'Pause Preview' : 'Play Preview'}
                </button>
              )}
            </div>
            {audioError && <p className="text-red-500 mb-4">Error with audio: {audioError}</p>}
          </div>
          {showPdfPreview && transcription.sheetMusic?.downloadUrl && (
            <div className="mt-4 p-4 border-t">
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
              {!pdfError && (
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



// {When closing TranscriptionDetails i get this:

//   Error loading audio: Event {isTrusted: true, type: 'error', target: audio, currentTarget: audio, eventPhase: 2, …}isTrusted: truebubbles: falsecancelBubble: falsecancelable: truecomposed: falsecurrentTarget: nulldefaultPrevented: falseeventPhase: 0returnValue: truesrcElement: nulltarget: nulltimeStamp: 60980.299999952316type: "error"[[Prototype]]: Event
  
//   Also In your most played the numbser of played impoes is not being incremented (its either 0 or 1)}