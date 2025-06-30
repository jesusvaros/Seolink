import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

interface IntroProps {
  title: string;
  description: string;
  backgroundImage?: string; // Add background image prop
}

export const Intro: React.FC<IntroProps> = ({ title, description, backgroundImage }) => {
  const frame = useCurrentFrame();
  
  // Forzar la precarga de la imagen de fondo
  React.useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => console.log('Imagen de fondo cargada correctamente');
      img.onerror = (e) => console.error('Error al cargar la imagen de fondo:', e);
    }
  }, [backgroundImage]);
  
  // Lógica para el parpadeo de la flecha (solo parpadea 2 veces en el segundo 2)
  const arrowBlinkFrame = frame - 60; // Comienza en el segundo 2 (60 frames)
  const showArrow = 
    (arrowBlinkFrame >= 0 && arrowBlinkFrame < 15) || // Primer parpadeo
    (arrowBlinkFrame >= 30 && arrowBlinkFrame < 45);   // Segundo parpadeo
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Fondo: imagen o gradiente - asegurando que aparezca desde el primer frame */}
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        zIndex: 1 // Aseguramos que esté por encima del fondo negro
      }}>
        {backgroundImage ? (
          <>
            {/* Precargar la imagen para asegurar que esté disponible inmediatamente */}
            <img 
              src={backgroundImage}
              alt="Background"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 1,
                display: 'block', // Asegura que se muestre como bloque
                visibility: 'visible' // Fuerza la visibilidad
              }}
              // Añadir prioridad alta para cargar
              loading="eager"
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)'
            }} />
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(45deg, #FF2C55, #FF6B81)',
            opacity: 1
          }} />
        )}
      </div>
      
      {/* Título en la parte superior, pero no pegado al borde */}
      <div style={{
        position: 'absolute',
        top: '380px',
        left: 0,
        width: '100%',
        padding: '0 20px',
        textAlign: 'center',
        zIndex: 20
      }}>
        <h1 style={{
          fontFamily: 'sans-serif',
          fontSize: '72px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          textShadow: '2px 2px 5px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 0, 0, 0.9)',
          margin: 0
        }}>
          {title}
        </h1>
      </div>
      
      {/* Flecha parpadeante a la derecha */}
      {showArrow ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '80px',
          transform: 'translateY(-50%)',
          fontSize: '150px',
          color: '#FFFFFF',
          fontWeight: 'bold',
          textShadow: '2px 2px 10px rgba(0, 0, 0, 0.8)',
          zIndex: 20
        }}>
          →
        </div>
      ) : null}
      
      {/* Dots del carrusel en la parte inferior - asegurando que sean visibles */}
      <div style={{
        position: 'absolute',
        bottom: '140px',
        left: '0',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 50
      }}>
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            opacity: 1,
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
          }} />
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            opacity: 0.6,
            boxShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
          }} />
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            opacity: 0.6,
            boxShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
          }} />
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            opacity: 0.6,
            boxShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
          }} />
        </div>
      </div>
    </div>
  );
};
