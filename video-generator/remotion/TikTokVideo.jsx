import React, { useEffect, useRef, useState } from 'react';
import { 
  AbsoluteFill, 
  Audio, 
  Sequence, 
  useCurrentFrame, 
  useVideoConfig,
  spring,
  interpolate
} from 'remotion';
import { TitleSlide } from './components/TitleSlide';
import { ProductSlide } from './components/ProductSlide';
import { CallToActionSlide } from './components/CallToActionSlide';

// Duración de cada sección en segundos
const TITLE_DURATION = 3;
const PRODUCT_DURATION = 6;
const CTA_DURATION = 4;

export const TikTokVideo = ({ title, products, audioPath, featuredImage }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const audioRef = useRef(null);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Calcular cuántos frames dura cada sección
  const titleDurationInFrames = TITLE_DURATION * fps;
  const productDurationInFrames = PRODUCT_DURATION * fps;
  const ctaDurationInFrames = CTA_DURATION * fps;
  
  // Calcular el tiempo total disponible para productos
  const totalProductsTime = durationInFrames - titleDurationInFrames - ctaDurationInFrames;
  
  // Ajustar la duración de cada producto si hay muchos
  const adjustedProductDuration = Math.min(
    productDurationInFrames,
    Math.floor(totalProductsTime / products.length)
  );
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Audio track */}
      <Audio
        src={audioPath}
        ref={audioRef}
        onLoad={(event) => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration);
          }
        }}
      />
      
      {/* Título inicial */}
      <Sequence from={0} durationInFrames={titleDurationInFrames}>
        <TitleSlide title={title} image={featuredImage} />
      </Sequence>
      
      {/* Productos */}
      {products.map((product, index) => {
        const startFrame = titleDurationInFrames + index * adjustedProductDuration;
        return (
          <Sequence
            key={product.asin || index}
            from={startFrame}
            durationInFrames={adjustedProductDuration}
          >
            <ProductSlide 
              product={product} 
              index={index} 
              totalProducts={products.length} 
            />
          </Sequence>
        );
      })}
      
      {/* Call to Action final */}
      <Sequence from={durationInFrames - ctaDurationInFrames} durationInFrames={ctaDurationInFrames}>
        <CallToActionSlide title={title} />
      </Sequence>
    </AbsoluteFill>
  );
};
