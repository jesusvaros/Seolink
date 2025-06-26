import React from 'react';
import { Composition } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';
// Ignoring the missing module warning since we'll handle it with TS downgrading
// @ts-ignore
import { TiktokCompositionWrapper } from './components/TiktokComposition';

// Define TikTok dimensions
// Vertical 9:16 format (1080x1920 is standard for TikTok)
const TIKTOK_WIDTH = 1080;
const TIKTOK_HEIGHT = 1920;
const FPS = 30;

// List of audio files (update these paths as needed)
const audioUrls = [
  'intro.mp3',
  'product1.mp3',
  'product2.mp3',
  'product3.mp3',
  'product4.mp3',
  'product5.mp3',
  'outro.mp3'
];

// This will be replaced with the actual duration calculation
let durationInFrames = 60 * FPS; // fallback default

// Calculate total duration (async IIFE since top-level await isn't always available)
(async () => {
  try {
    const durations = await Promise.all(
      audioUrls.map((url) => getAudioDurationInSeconds(url))
    );
    const totalSeconds = durations.reduce((sum, dur) => sum + dur, 0);
    durationInFrames = Math.ceil(totalSeconds * FPS);
    // Optionally trigger a re-render or notify Remotion if needed
    // (depends on how you trigger renders)
  } catch (err) {
    console.error('Error getting audio durations:', err);
  }
})();

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
        component={TiktokCompositionWrapper}
        // Use dynamic duration calculated from all audio files
        durationInFrames={durationInFrames}
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
