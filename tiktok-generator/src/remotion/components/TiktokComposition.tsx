import React from 'react';
import { AbsoluteFill, Audio, useVideoConfig, Sequence } from 'remotion';
// @ts-ignore - Importing components with appropriate extensions
import {TextOverlay} from './TextOverlay';
import {Intro} from './Intro';
import {Outro} from './Outro';

// Audio segment interface that mirrors the one from voiceSynthesizer.js
interface AudioSegmentData {
  type: string; // 'intro', 'product', or 'outro'
  index?: number; // Used for products to determine order
  text: string;
  audioData: string; // Base64 data URL for audio
}

interface TiktokCompositionProps {
  images: string[];
  script: string;
  title: string;
  description: string;
  audioSegments: AudioSegmentData[]; // Segmented audio data
}

export const TiktokComposition: React.FC<TiktokCompositionProps> = ({
  images,
  script,
  title,
  description,
  audioSegments,
}) => {
  const { fps } = useVideoConfig();
  
  // Find intro, product segments, and outro
  const introSegment = audioSegments.find(seg => seg.type === 'intro');
  const productSegments = audioSegments.filter(seg => seg.type === 'product')
    .sort((a, b) => (a.index || 0) - (b.index || 0));
  const outroSegment = audioSegments.find(seg => seg.type === 'outro');
  
  // Create a mapping between product segments and images
  // We'll use the product images in order, skipping the first image (which is the main image)
  // and the last image (which is the logo)
  const productImages = images.slice(1, -1);
  
  // Calculate estimated durations in frames for each segment based on text length
  // We'll use a rough estimate of 10 characters per second at 30fps
  const getEstimatedFrames = (text: string) => {
    const chars = text.length;
    const seconds = Math.max(2, chars / 10); // Minimum 2 seconds per segment
    return Math.ceil(seconds * fps);
  };
  
  // Calculate frame ranges for each segment
  const introFrames = introSegment ? getEstimatedFrames(introSegment.text) : fps * 3;
  const outroFrames = outroSegment ? getEstimatedFrames(outroSegment.text) : fps * 3;
  
  // Product segments timing
  const productFrames = productSegments.map(seg => getEstimatedFrames(seg.text));
  const totalProductFrames = productFrames.reduce((sum, frames) => sum + frames, 0);
  
  // Main sections timing
  const introEndFrame = introFrames;
  const productStartFrame = introEndFrame;
  const outroStartFrame = productStartFrame + totalProductFrames;
  
  console.log(`Using ${audioSegments.length} audio segments with estimated timing:`);
  console.log(`- Intro: ${introFrames} frames`);
  console.log(`- Products: ${totalProductFrames} frames (${productSegments.length} products)`);
  console.log(`- Outro: ${outroFrames} frames`);
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Intro Section */}
      {introSegment && (
        <Sequence from={0} durationInFrames={introFrames}>
          <Intro title={title} description={description} />
          <Audio src={introSegment.audioData} />
        </Sequence>
      )}
      
      {/* Product Sections - Each with its own image and audio */}
      {productSegments.map((segment, index) => {
        const startFrame = productStartFrame + 
          productFrames.slice(0, index).reduce((sum, frames) => sum + frames, 0);
        const duration = productFrames[index];
        const imageIndex = index % productImages.length; // Loop through available product images
        
        return (
          <Sequence key={`product-${index}`} from={startFrame} durationInFrames={duration}>
            <AbsoluteFill>
              {/* Display the product image */}
              <img 
                src={productImages[imageIndex]} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  opacity: 0.8, // Slightly dimmed to make text more readable
                }} 
              />
              
              {/* Display the product text */}
              <TextOverlay text={segment.text} />
              
              {/* Play the product audio */}
              <Audio src={segment.audioData} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      
      {/* Outro Section */}
      {outroSegment && (
        <Sequence from={outroStartFrame} durationInFrames={outroFrames}>
          <Outro />
          <Audio src={outroSegment.audioData} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
