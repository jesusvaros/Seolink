import React from 'react';
import { Composition } from 'remotion';
// Ignoring the missing module warning since we'll handle it with TS downgrading
// @ts-ignore
import { TiktokCompositionWrapper } from './components/TiktokComposition';

// Define TikTok dimensions
// Vertical 9:16 format (1080x1920 is standard for TikTok)
const TIKTOK_WIDTH = 1080;
const TIKTOK_HEIGHT = 1920;
const FPS = 30;

// The actual duration is calculated in videoRenderer.ts based on the audio segments
// and passed to the composition via the bundler
// For the Remotion Studio preview, we'll use a variable that will be overridden
// by videoRenderer.ts when rendering the actual video
const INITIAL_DURATION = 60 * FPS; // This is just for the Remotion Studio preview

// Export the Root component for Remotion
export const TiktokVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="TiktokVideo"
        component={TiktokCompositionWrapper}
        // This duration will be overridden by videoRenderer.ts when rendering
        // based on the actual audio segment durations
        durationInFrames={INITIAL_DURATION}
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
