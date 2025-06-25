import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

interface TextOverlayProps {
  text: string;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ text }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Split text into sentences for animation
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Calculate which sentence to show based on frame
  const secondsPerSentence = 3;
  const framesPerSentence = secondsPerSentence * fps;
  const currentSentenceIndex = Math.min(
    Math.floor(frame / framesPerSentence),
    sentences.length - 1
  );
  
  // Calculate animation for current sentence
  const progress = spring({
    frame: frame % framesPerSentence,
    fps,
    config: {
      damping: 20,
      mass: 0.5,
      stiffness: 100,
    },
  });
  
  // Current sentence with animation
  const currentSentence = sentences[currentSentenceIndex] || '';
  
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        padding: '0 40px 200px',
      }}
    >
      <div
        style={{
          fontFamily: 'sans-serif',
          fontSize: '42px',
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
          opacity: progress,
          transform: `translateY(${(1 - progress) * 20}px)`,
        }}
      >
        {currentSentence}
      </div>
    </AbsoluteFill>
  );
};
