import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Share2, Check } from 'lucide-react';

export const SHARE_TRANSCRIPTION = gql`
  mutation ShareTranscription($transcriptionId: ID!) {
    shareTranscription(transcriptionId: $transcriptionId) {
      shareUrl
    }
  }
`;

interface ShareComponentProps {
  transcriptionId: string;
}

const ShareComponent: React.FC<ShareComponentProps> = ({ transcriptionId }) => {
  const [isShared, setIsShared] = useState(false);
  const [shareTranscription] = useMutation(SHARE_TRANSCRIPTION);

  const handleShare = async () => {
    try {
      const { data } = await shareTranscription({
        variables: { transcriptionId },
      });
      
      if (data.shareTranscription.shareUrl) {
        await navigator.clipboard.writeText(data.shareTranscription.shareUrl);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 3000); // Reset after 3 seconds
      }
    } catch (error) {
      console.error('Error sharing transcription:', error);
      alert('Failed to share transcription. Please try again.');
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded inline-flex items-center justify-center transition-colors duration-200 ${
        isShared 
          ? 'bg-green-500 hover:bg-green-600' 
          : 'bg-blue-500 hover:bg-blue-600'
      } text-white`}
      title={isShared ? 'Link Copied!' : 'Share'}
    >
      {isShared ? <Check size={24} /> : <Share2 size={24} />}
    </button>
  );
};

export default ShareComponent;