import React from 'react';
import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig,
  spring,
  interpolate
} from 'remotion';

export const CallToActionSlide = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Animaciones para la entrada del CTA
  const ctaProgress = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: Math.floor(durationInFrames * 0.4),
  });
  
  // Animación pulsante para el botón
  const buttonPulse = interpolate(
    Math.sin(frame / 10),
    [-1, 1],
    [0.95, 1.05]
  );
  
  // Estilos para el contenedor principal
  const containerStyle = {
    backgroundColor: '#000',
    fontFamily: 'Arial, sans-serif',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    textAlign: 'center',
  };
  
  // Estilos para el mensaje final
  const messageStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '40px',
    opacity: ctaProgress,
    transform: `translateY(${interpolate(ctaProgress, [0, 1], [30, 0])}px)`,
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
  };
  
  // Estilos para el botón de CTA
  const buttonStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    backgroundColor: '#FF4500', // Color naranja de Amazon
    color: 'white',
    padding: '20px 40px',
    borderRadius: '50px',
    border: 'none',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    opacity: ctaProgress,
    transform: `scale(${buttonPulse})`,
    transition: 'transform 0.3s ease',
  };
  
  // Estilos para el subtexto
  const subtextStyle = {
    fontSize: '24px',
    marginTop: '30px',
    opacity: interpolate(frame, [durationInFrames * 0.5, durationInFrames * 0.7], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  };
  
  // Estilos para el emoji
  const emojiStyle = {
    fontSize: '40px',
    marginRight: '10px',
    display: 'inline-block',
    animation: 'bounce 1s infinite',
  };
  
  return (
    <AbsoluteFill style={containerStyle}>
      <div style={messageStyle}>
        ¿Te ha gustado esta comparativa de productos?
      </div>
      
      <button style={buttonStyle}>
        VER OFERTAS AHORA
      </button>
      
      <div style={subtextStyle}>
        <span style={emojiStyle}>👉</span>
        Encuentra más detalles y ofertas en nuestra web
      </div>
    </AbsoluteFill>
  );
};
