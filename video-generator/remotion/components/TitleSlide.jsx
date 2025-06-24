import React from 'react';
import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig,
  spring,
  interpolate,
  Img
} from 'remotion';

export const TitleSlide = ({ title, image }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Animaciones para el título
  const titleOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: Math.floor(durationInFrames * 0.3),
  });
  
  const titleScale = spring({
    frame,
    fps,
    from: 1.2,
    to: 1,
    durationInFrames: Math.floor(durationInFrames * 0.5),
  });
  
  // Animación de zoom suave para la imagen de fondo
  const zoomScale = interpolate(
    frame,
    [0, durationInFrames],
    [1, 1.1],
    { extrapolateRight: 'clamp' }
  );
  
  // Estilos para el contenedor principal
  const containerStyle = {
    backgroundColor: '#000',
    fontFamily: 'Arial, sans-serif',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  };
  
  // Estilos para la imagen de fondo
  const imageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${zoomScale})`,
    opacity: 0.8,
  };
  
  // Estilos para el overlay oscuro
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
  };
  
  // Estilos para el contenedor del título
  const titleContainerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    zIndex: 2,
    opacity: titleOpacity,
    transform: `scale(${titleScale})`,
  };
  
  // Estilos para el título
  const titleStyle = {
    fontSize: '72px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 0,
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '15px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    lineHeight: 1.2,
  };
  
  return (
    <AbsoluteFill style={containerStyle}>
      {image && <Img src={image} style={imageStyle} />}
      <div style={overlayStyle} />
      <div style={titleContainerStyle}>
        <h1 style={titleStyle}>{title}</h1>
      </div>
    </AbsoluteFill>
  );
};
