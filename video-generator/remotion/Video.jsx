import { Composition, getInputProps } from 'remotion';
import { TikTokVideo } from './TikTokVideo';

// Configuración de la composición principal
export const RemotionVideo = () => {
  const { title, products, audioPath, imageUrl, fps = 30, durationInSeconds = 45 } = getInputProps();
  
  return (
    <>
      <Composition
        id="TikTokVideo"
        component={TikTokVideo}
        durationInFrames={durationInSeconds * fps}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{
          title,
          products,
          audioPath,
          featuredImage: imageUrl,
        }}
      />
    </>
  );
};
