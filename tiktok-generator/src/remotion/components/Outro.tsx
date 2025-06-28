import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, staticFile } from 'remotion';

interface OutroProps {
}

export const Outro: React.FC<OutroProps> = () => {
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
          Siguenos para Más!
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
          👉 Comenta cual es tu favorito 👈
        </p>
        
        {/* Logo - Más grande */}
        <div style={{ marginTop: '20px', maxWidth: '600px', maxHeight: '600px' }}>
          <img 
            src={staticFile('logo_color.png')} 
            alt="Logo"
            style={{
              width: '100%',
              height: 'auto',
              filter: 'drop-shadow(0px 0px 15px rgba(255, 255, 255, 0.7))',
            }}
          />
        </div>
        
        {/* LINK EN BIO destacado */}
        <div 
          style={{
            marginTop: '30px',
            backgroundColor: '#FFFFFF',
            padding: '15px 30px',
            borderRadius: '30px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
            transform: `scale(${spring({
              frame: frame - 15,
              from: 0.8,
              to: 1.1,
              fps: 30,
              config: { mass: 0.5, damping: 8 }
            })})`,
          }}
        >
          <h3
            style={{
              fontFamily: 'sans-serif',
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#FF2C55',
              margin: 0,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            LINK EN EL PERFIL
          </h3>
        </div>
      </div>
    </AbsoluteFill>
  );
};
