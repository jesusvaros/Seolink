import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';

interface IntroProps {
  title: string;
  description: string;
  backgroundImage?: string; // Add background image prop
}

export const Intro: React.FC<IntroProps> = ({ title, description, backgroundImage }) => {
  const frame = useCurrentFrame();
  
  // Spring animation for title
  const titleOpacity = spring({
    frame: frame - 5,
    from: 0,
    to: 1,
    fps: 30,
    config: { damping: 12 },
  });
  
  const titleScale = interpolate(
    spring({
      frame: frame - 5,
      from: 0,
      to: 1,
      fps: 30,
      config: { damping: 12 },
    }),
    [0, 1],
    [0.8, 1]
  );
  
  // Animation for description
  const descriptionOpacity = spring({
    frame: frame - 20,
    from: 0,
    to: 1,
    fps: 30,
    config: { damping: 12 },
  });
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background image or gradient fallback */}
      {backgroundImage ? (
        <AbsoluteFill>
          <img 
            src={backgroundImage}
            alt="Background"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.7, // Slightly dimmed to make text readable
            }}
          />
          {/* Dark overlay for better text readability */}
          <AbsoluteFill
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(45deg, #FF2C55, #FF6B81)',
            opacity: 0.8,
          }}
        />
      )}
      
      {/* Content container */}
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '80%' }}>
        <h1
          style={{
            fontFamily: 'sans-serif',
            fontSize: '72px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 10px rgba(0, 0, 0, 0.3)',
            margin: 0,
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
          }}
        >
          {title}
        </h1>
        
        <p
          style={{
            fontFamily: 'sans-serif',
            fontSize: '32px',
            color: 'white',
            textShadow: '1px 1px 5px rgba(0, 0, 0, 0.3)',
            marginTop: '20px',
            opacity: descriptionOpacity,
          }}
        >
         🔥 🔥 No te creeras el numero 4 🔥 🔥
        </p>
        <p
          style={{
            fontFamily: 'sans-serif',
            fontSize: '32px',
            color: 'white',
            textShadow: '1px 1px 5px rgba(0, 0, 0, 0.3)',
            marginTop: '20px',
            opacity: descriptionOpacity,
          }}
        >
         🔥 🔥 No te creeras el numero 4 🔥 🔥
        </p>
      </div>
    </AbsoluteFill>
  );
};
