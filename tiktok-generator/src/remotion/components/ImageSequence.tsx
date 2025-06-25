import React from 'react';
import { AbsoluteFill, interpolate, useVideoConfig } from 'remotion';

interface ImageSequenceProps {
  images: string[];
  frame: number;
}

export const ImageSequence: React.FC<ImageSequenceProps> = ({ images, frame }) => {
  const { fps } = useVideoConfig();
  
  // If no images, show a default background
  if (!images.length) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#0F0F0F' }} />
    );
  }
  
  // Calculate which image to show based on frame
  // Show each image for 3 seconds
  const secondsPerImage = 3;
  const framesPerImage = secondsPerImage * fps;
  const imageIndex = Math.min(
    Math.floor(frame / framesPerImage) % images.length,
    images.length - 1
  );
  const nextImageIndex = (imageIndex + 1) % images.length;
  
  // Calculate transition progress (0-1)
  const transitionProgress = (frame % framesPerImage) / framesPerImage;
  
  // Apply zoom effect to current image
  const scale = interpolate(
    transitionProgress,
    [0, 1],
    [1, 1.05]
  );
  
  // Apply fade in effect to next image
  const opacity = interpolate(
    transitionProgress,
    [0.8, 1],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  return (
    <AbsoluteFill>
      {/* Current image */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <AbsoluteFill
          style={{
            transform: `scale(${scale})`,
            backgroundImage: `url(${images[imageIndex]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </AbsoluteFill>
      
      {/* Next image (fading in) */}
      <AbsoluteFill
        style={{
          opacity,
          backgroundImage: `url(${images[nextImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Overlay for better text visibility */}
      <AbsoluteFill
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
      />
    </AbsoluteFill>
  );
};
