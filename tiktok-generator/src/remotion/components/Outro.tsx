import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring } from 'remotion';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Spring animation for call to action
  const opacity = spring({
    frame,
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
      {/* Gradient background */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(45deg, #FF2C55, #FF6B81)',
          opacity: 0.8,
        }}
      />
      
      {/* Call to action */}
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          opacity,
        }}
      >
        <h2
          style={{
            fontFamily: 'sans-serif',
            fontSize: '64px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 10px rgba(0, 0, 0, 0.3)',
            margin: 0,
          }}
        >
          Follow for more!
        </h2>
        
        <p
          style={{
            fontFamily: 'sans-serif',
            fontSize: '40px',
            color: 'white',
            textShadow: '1px 1px 5px rgba(0, 0, 0, 0.3)',
            marginTop: '20px',
          }}
        >
          👉 Like, Comment & Share 👈
        </p>
      </div>
    </AbsoluteFill>
  );
};
