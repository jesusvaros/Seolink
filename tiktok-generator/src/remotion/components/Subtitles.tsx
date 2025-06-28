import React from 'react';
import { useCurrentFrame } from 'remotion';

interface SubtitlesProps {
  text: string;
  wordsPerFrame?: number;
}

export const Subtitles: React.FC<SubtitlesProps> = ({ text, wordsPerFrame = 0.2 }) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  
  // Calculate how many words should be visible based on current frame
  // wordsPerFrame controls how fast words appear (lower = slower)
  const visibleWords = Math.min(Math.ceil(frame * wordsPerFrame), words.length);
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '12%', // Un poco más arriba para mejor visibilidad
      left: '50%',
      transform: 'translateX(-50%)',
      width: '94%', // Un poco más ancho para acomodar texto más grande
      textAlign: 'center',
      zIndex: 100,
    }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Fondo más oscuro para mejor contraste
        borderRadius: '12px',
        padding: '18px', // Más padding para texto más grande
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', // Sombra más pronunciada
      }}>
        <p style={{
          fontFamily: 'sans-serif',
          fontSize: '44px', // Aumentado de 32px a 44px
          fontWeight: 'bold',
          color: 'white',
          margin: 0,
          lineHeight: 1.4, // Aumentado para mejor espaciado
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)', // Sombra más pronunciada para mejor contraste
        }}>
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
  );
};
