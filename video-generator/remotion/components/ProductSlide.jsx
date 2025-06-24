import React from 'react';
import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig,
  spring,
  interpolate,
  Img,
  Sequence
} from 'remotion';

export const ProductSlide = ({ product, index, totalProducts }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Animaciones para entrada y salida
  const entryProgress = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: Math.floor(durationInFrames * 0.25),
  });
  
  const exitProgress = spring({
    frame: frame - (durationInFrames - Math.floor(durationInFrames * 0.25)),
    fps,
    from: 0,
    to: 1,
    durationInFrames: Math.floor(durationInFrames * 0.25),
    clamp: true,
  });
  
  // Calcular opacidad basada en entrada y salida
  const opacity = interpolate(
    exitProgress,
    [0, 1],
    [entryProgress, 0]
  );
  
  // Animación de zoom para la imagen del producto
  const imageScale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    durationInFrames: Math.floor(durationInFrames * 0.5),
  });
  
  // Animación para el precio
  const priceProgress = spring({
    frame: frame - Math.floor(durationInFrames * 0.3),
    fps,
    from: 0,
    to: 1,
    durationInFrames: Math.floor(durationInFrames * 0.2),
    clamp: true,
  });
  
  // Animación para los pros y contras
  const prosConsProgress = spring({
    frame: frame - Math.floor(durationInFrames * 0.5),
    fps,
    from: 0,
    to: 1,
    durationInFrames: Math.floor(durationInFrames * 0.2),
    clamp: true,
  });
  
  // Estilos para el contenedor principal
  const containerStyle = {
    backgroundColor: '#000',
    fontFamily: 'Arial, sans-serif',
    color: '#fff',
    opacity,
    display: 'flex',
    flexDirection: 'column',
    padding: '40px',
    justifyContent: 'center',
    alignItems: 'center',
  };
  
  // Estilos para el indicador de producto
  const indicatorStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '10px 20px',
    borderRadius: '20px',
  };
  
  // Estilos para el nombre del producto
  const nameStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 0 20px 0',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
  };
  
  // Estilos para la imagen del producto
  const imageContainerStyle = {
    width: '100%',
    height: '40%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '30px',
    transform: `scale(${imageScale})`,
  };
  
  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  };
  
  // Estilos para el precio
  const priceStyle = {
    fontSize: '64px',
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: '20px',
    opacity: priceProgress,
    transform: `translateY(${interpolate(priceProgress, [0, 1], [20, 0])}px)`,
  };
  
  // Estilos para las características
  const featuresContainerStyle = {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: prosConsProgress,
    transform: `translateY(${interpolate(prosConsProgress, [0, 1], [20, 0])}px)`,
  };
  
  // Estilos para pros y contras
  const prosConsStyle = {
    flex: 1,
    padding: '15px',
    margin: '0 10px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  };
  
  const prosStyle = {
    ...prosConsStyle,
    borderLeft: '4px solid #4CAF50',
  };
  
  const consStyle = {
    ...prosConsStyle,
    borderLeft: '4px solid #F44336',
  };
  
  const listTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center',
  };
  
  const listStyle = {
    fontSize: '20px',
    margin: 0,
    padding: '0 0 0 20px',
  };
  
  const listItemStyle = {
    margin: '5px 0',
  };
  
  return (
    <AbsoluteFill style={containerStyle}>
      <div style={indicatorStyle}>
        {index + 1}/{totalProducts}
      </div>
      
      <h2 style={nameStyle}>{product.name}</h2>
      
      <div style={imageContainerStyle}>
        {product.image && <Img src={product.image} style={imageStyle} />}
      </div>
      
      {product.price && (
        <div style={priceStyle}>
          {product.price}
        </div>
      )}
      
      <div style={featuresContainerStyle}>
        {product.pros && product.pros.length > 0 && (
          <div style={prosStyle}>
            <h3 style={listTitleStyle}>Pros</h3>
            <ul style={listStyle}>
              {product.pros.slice(0, 3).map((pro, i) => (
                <li key={i} style={listItemStyle}>{pro}</li>
              ))}
            </ul>
          </div>
        )}
        
        {product.cons && product.cons.length > 0 && (
          <div style={consStyle}>
            <h3 style={listTitleStyle}>Contras</h3>
            <ul style={listStyle}>
              {product.cons.slice(0, 3).map((con, i) => (
                <li key={i} style={listItemStyle}>{con}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
