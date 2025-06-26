import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring } from 'remotion';

interface OutroProps {
  logoUrl?: string; // Logo URL for the outro
}

export const Outro: React.FC<OutroProps> = ({ logoUrl }) => {
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
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
            marginBottom: '40px',
          }}
        >
          👉 Like, Comment & Share 👈
        </p>
        
        {/* Logo */}
        {logoUrl && (
          <div style={{ marginTop: '20px', maxWidth: '200px', maxHeight: '200px' }}>
            <img 
              src={logoUrl} 
              alt="Logo"
              style={{
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.5))',
              }}
            />
          </div>
        )}  
      </div>
    </AbsoluteFill>
  );
};
