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
  mainImage?: string; // Main image for intro background
  logoUrl?: string; // Logo URL for outro
}

export const TiktokComposition: React.FC<TiktokCompositionProps> = ({
  images,
  script,
  title,
  description,
  audioSegments,
  mainImage,
  logoUrl,
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
  
  // Calculate durations based on actual audio durations or fallback to estimates
  // For audio segments, a typical MP3 at 128kbps is roughly 16KB per second
  // This helps us make a better estimate when exact duration isn't available
  const getAudioDurationInFrames = (segment: AudioSegmentData) => {
    // Calculate estimated duration from base64 length (rough approximation)
    const base64Length = segment.audioData.length;
    const audioDataLength = base64Length * 0.75; // Base64 is ~4/3 the size of the binary data
    const estimatedDuration = audioDataLength / 16000; // ~16KB per second at 128kbps
    
    // Ensure a minimum duration and convert to frames
    const seconds = Math.max(2, estimatedDuration); 
    return Math.ceil(seconds * fps);
  };
  
  // Calculate frame ranges for each segment based on estimated audio durations
  const introFrames = introSegment ? getAudioDurationInFrames(introSegment) : fps * 3;
  const outroFrames = outroSegment ? getAudioDurationInFrames(outroSegment) : fps * 3;
  
  // Product segments timing based on audio durations
  const productFrames = productSegments.map(seg => getAudioDurationInFrames(seg));
  const totalProductFrames = productFrames.reduce((sum, frames) => sum + frames, 0);
  
  // Main sections timing
  const introEndFrame = introFrames;
  const productStartFrame = introEndFrame;
  const outroStartFrame = productStartFrame + totalProductFrames;
  
  // Calculate total video duration based on all segments
  const totalDuration = outroStartFrame + outroFrames;
  
  console.log(`Using ${audioSegments.length} audio segments with estimated timing:`);
  console.log(`- Intro: ${introFrames} frames`);
  console.log(`- Products: ${totalProductFrames} frames (${productSegments.length} products)`);
  console.log(`- Outro: ${outroFrames} frames`);
  
  // Make sure totalDuration is visible in React DevTools for debugging
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.TIKTOK_TOTAL_DURATION = totalDuration;
      console.log(`Total video duration: ${totalDuration} frames (${(totalDuration / fps).toFixed(2)} seconds)`);
    }
  }, [totalDuration]);
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Intro Section */}
      {introSegment && (
        <Sequence from={0} durationInFrames={introFrames}>
          <Intro 
            title={title} 
            description={description} 
            backgroundImage={mainImage} // Pass main image as background
          />
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
          <Outro logoUrl={logoUrl} />
          <Audio src={outroSegment.audioData} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
