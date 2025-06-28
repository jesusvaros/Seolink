import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

interface TextOverlayProps {
  text: string;
  productName?: string;
  productIndex?: number;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ text, productName, productIndex }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Split text into words for word-by-word animation
  const words = text.split(' ');
  
  // Calculate how many words should be visible based on current frame
  // Adjust wordsPerFrame to control speed (lower = slower)
  const wordsPerFrame = 0.1;
  const visibleWords = Math.min(Math.ceil(frame * wordsPerFrame), words.length);
  
  // Animation for product title and number
  const titleProgress = spring({
    frame: Math.min(frame, 15),
    fps,
    config: {
      damping: 12,
      mass: 0.4,
      stiffness: 100,
    },
  });
  
  return (
    <AbsoluteFill>
      {/* Product Number and Name at the top */}
      {productName && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `translateY(${(1 - titleProgress) * -50}px)`,
            opacity: titleProgress,
          }}
        >
          {/* Product Number Badge */}
          {productIndex !== undefined && (
            <div
              style={{
                backgroundColor: '#FF2C55',
                color: 'white',
                borderRadius: '50%',
                width: '70px', // Aumentado de 60px a 70px
                height: '70px', // Aumentado de 60px a 70px
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '40px', // Aumentado de 32px a 40px
                fontWeight: 'bold',
                marginBottom: '12px', // Aumentado de 10px a 12px
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4)', // Sombra más pronunciada
              }}
            >
              {productIndex + 1}
            </div>
          )}
          
          {/* Product Name */}
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fondo más oscuro para mejor contraste
              padding: '15px 25px', // Más padding para texto más grande
              borderRadius: '12px',
              maxWidth: '90%', // Más ancho para acomodar texto más grande
              boxShadow: '0 6px 12px rgba(0, 0, 0, 0.5)', // Añadir sombra para mejor visibilidad
            }}
          >
            <h2
              style={{
                fontFamily: 'sans-serif',
                fontSize: '48px', // Aumentado de 36px a 48px
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                textAlign: 'center',
                textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)', // Sombra más pronunciada
                letterSpacing: '0.5px', // Mejor espaciado entre letras
              }}
            >
              {productName}
            </h2>
          </div>
        </div>
      )}
      
      {/* Word-by-word subtitles at the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%', // Un poco más arriba para mejor visibilidad
          left: '50%',
          transform: 'translateX(-50%)',
          width: '94%', // Un poco más ancho para acomodar texto más grande
          textAlign: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Fondo más oscuro para mejor contraste
            borderRadius: '12px',
            padding: '18px', // Más padding para texto más grande
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.5)', // Sombra más pronunciada
          }}
        >
          <p
            style={{
              fontFamily: 'sans-serif',
              fontSize: '44px', // Aumentado de 32px a 44px
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              lineHeight: 1.4, // Aumentado para mejor espaciado
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)', // Sombra más pronunciada
              letterSpacing: '0.5px', // Mejor espaciado entre letras
            }}
          >
            {words.map((word, i) => (
              <span
                key={i}
                style={{
                  opacity: i < visibleWords ? 1 : 0,
                  color: i < visibleWords ? '#FFFFFF' : 'transparent',
                  marginRight: '10px', // Más espacio entre palabras
                  display: 'inline-block',
                  transition: 'opacity 0.2s ease',
                  // Eliminamos la transformación de escala para evitar el efecto de "baile"
                }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
