import React from 'react';
import { Composition } from 'remotion';
// Ignoring the missing module warning since we'll handle it with TS downgrading
// @ts-ignore
import { TiktokComposition } from './components/TiktokComposition';

// Define TikTok dimensions
// Vertical 9:16 format (1080x1920 is standard for TikTok)
const TIKTOK_WIDTH = 1080;
const TIKTOK_HEIGHT = 1920;
const FPS = 30;

interface TiktokVideoProps {
  images: string[];
  audioData: string; // Changed to audioData for base64 encoded audio
  script: string;
  title: string;
  description: string;
}

// Define props schema for Remotion
type RemotionProps = Record<string, unknown>;

// Export the Root component for Remotion
export const TiktokVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="TiktokVideo"
        // @ts-ignore - Ignore type checking for Remotion component
        component={TiktokComposition}
        durationInFrames={30 * FPS} // Default 30 seconds, will be adjusted based on audio
        fps={FPS}
        width={TIKTOK_WIDTH}
        height={TIKTOK_HEIGHT}
        defaultProps={{
          images: [],
          audioData: '',
          script: '',
          title: 'TikTok Video',
          description: 'Generated with Remotion'
        }}
      />
    </>
  );
};
