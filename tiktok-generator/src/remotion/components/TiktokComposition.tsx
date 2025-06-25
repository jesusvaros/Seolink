import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, useVideoConfig, useCurrentFrame } from 'remotion';
// @ts-ignore - Importing components with appropriate extensions
import {ImageSequence} from './ImageSequence';
import {TextOverlay} from './TextOverlay';
import {Intro} from './Intro';
import {Outro} from './Outro';

interface TiktokCompositionProps {
  images: string[];
  audioData: string; // Changed to audioData for base64 encoded audio
  script: string;
  title: string;
  description: string;
}

export const TiktokComposition: React.FC<TiktokCompositionProps> = ({
  images,
  audioData,
  script,
  title,
  description,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Calculate timing for different sections
  const introEndFrame = fps * 3; // 3 seconds for intro
  const outroStartFrame = Math.max(0, durationInFrames - fps * 3); // 3 seconds for outro
  
  // Determine which section we're in
  const inIntro = frame < introEndFrame;
  const inOutro = frame >= outroStartFrame;
  const inMain = !inIntro && !inOutro;
  
  // Calculate text fragments to show based on current frame
  const textToShow = useMemo(() => {
    // This would ideally use the audio duration to time the text appearance
    // For now, we'll simplify and just show parts of the script based on frames
    const words = script.split(' ');
    const wordsPerSecond = 2; // Average reading speed
    const wordCount = Math.min(
      Math.floor((frame - introEndFrame) / fps * wordsPerSecond),
      words.length
    );
    
    return words.slice(0, wordCount).join(' ');
  }, [frame, script, introEndFrame, fps]);
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background image sequence */}
      {inMain && <ImageSequence images={images} frame={frame - introEndFrame} />}
      
      {/* Introduction screen */}
      {inIntro && <Intro title={title} description={description} />}
      
      {/* Main content with text overlay */}
      {inMain && (
        <TextOverlay text={textToShow} />
      )}
      
      {/* Outro/Call to action */}
      {inOutro && <Outro />}
      
      {/* Audio track - using data URL */}
      {audioData && <Audio src={audioData} />}
    </AbsoluteFill>
  );
};
