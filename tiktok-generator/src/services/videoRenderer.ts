import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { getCompositions } from '@remotion/renderer';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { WebpackOverrideFn } from '@remotion/bundler';
import { AudioSegment } from './voiceSynthesizer.js';

// Define constants for video rendering
const FPS = 30; // Frames per second, must match the value in TiktokVideo.tsx

interface VideoRenderOptions {
  images: string[];
  script: string;
  metadata: Record<string, any>;
  slideImages?: string[]; // Array with article main image, product images and logo
  audioSegments: AudioSegment[]; // Structured audio segments
  outputDir?: string; // Output directory
  outputPath?: string; // Specific path for the output video
}

export async function renderVideo({ 
  images, 
  script,
  metadata,
  slideImages = [],
  audioSegments, 
  outputDir = path.join(process.cwd(), 'output'),
  outputPath
}: VideoRenderOptions): Promise<string> {
  try {
    // Use slideImages with priority if they exist
    const imagesToUse = slideImages.length > 0 ? slideImages : images;
    
    // Ensure output directory exists
    if (outputPath && path.dirname(outputPath) !== outputDir) {
      await fs.ensureDir(path.dirname(outputPath));
    } else {
      await fs.ensureDir(outputDir);
    }
    
    // Create a temporary directory for bundling
    const tempDir = path.join(os.tmpdir(), `remotion-render-${Date.now()}`);
    await fs.ensureDir(tempDir);
    
    // Initialize Remotion bundler
    console.log('Initializing Remotion bundler...');
    
    // Setup input props for the video
    console.log(`Using segmented audio approach with ${audioSegments.length} segments`);
    
    // Verificar que los productos están disponibles en metadata
    console.log('==========================================');
    console.log('PRODUCTOS EN METADATA:', metadata?.products ? metadata.products.length : 0);
    if (metadata?.products?.length > 0) {
      console.log('PRIMER PRODUCTO:', metadata.products[0].name);
      console.log('TODOS LOS PRODUCTOS:');
      metadata.products.forEach((product: any, index: number) => {
        console.log(`  ${index + 1}. ${product.name}`);
      });
    } else {
      console.log('NO HAY PRODUCTOS EN METADATA');
    }
    console.log('==========================================');
    
    const inputProps = {
      images: imagesToUse,
      audioSegments: audioSegments.map(segment => ({
        type: segment.type,
        index: segment.index || 0,
        text: segment.text,
        audioData: `data:audio/mp3;base64,${segment.audioBase64}`
      })),
      script,
      title: metadata?.title || 'TikTok Video',
      description: metadata?.description || '',
      mainImage: imagesToUse.length > 0 ? imagesToUse[0] : undefined, // First image is main image
      logoUrl: imagesToUse.length > 1 ? imagesToUse[imagesToUse.length - 1] : '/logo.svg', // Last image is logo
      products: metadata?.products || [], // Pasar los productos del MDX
      metadata // Pasar todo el metadata por si necesitamos más información
    };
    
    // Verificar que los productos se están pasando correctamente
    console.log('Products en inputProps:', inputProps.products ? inputProps.products.length : 0);
    
    // Calculate estimated video duration based on audio segments
    // This helps ensure the video is just the right length for the content
    let estimatedDurationInFrames = 0;
    
    // Calculate the total duration based on the audio segments
    if (audioSegments && audioSegments.length > 0) {
      // Each audio segment has base64 data we can use to estimate duration
      for (const segment of audioSegments) {
        // Calculate audio duration from base64 length
        // Base64 encodes 3 bytes into 4 characters, so we can estimate the audio length
        const base64Length = segment.audioBase64.length;
        const audioDataLength = base64Length * 0.75; // Convert base64 length to byte length
        const estimatedDuration = audioDataLength / 16000; // Assuming 16kHz mono audio
        const seconds = Math.max(2, estimatedDuration); // Ensure at least 2 seconds per segment
        estimatedDurationInFrames += Math.ceil(seconds * FPS);
      }
      console.log(`Calculated total duration: ${estimatedDurationInFrames} frames (${estimatedDurationInFrames/FPS} seconds)`); 
    } else {
      console.error('No audio segments provided, using default duration');
      estimatedDurationInFrames = 60 * FPS; // Default to 60 seconds if no audio segments
    }
    
    // Set up bundler options for Remotion
    const webpackOverride: WebpackOverrideFn = (config) => {
      return {
        ...config,
        resolve: {
          ...config.resolve,
          fallback: {
            fs: false,
            path: false,
            os: false,
          },
        },
      };
    };

    // Bundle the Remotion project
    console.log('Bundling Remotion project...');
    const bundled = await bundle({
      entryPoint: path.resolve(process.cwd(), 'dist/remotion/index.js'),
      webpackOverride,
    });

    // Get the composition
    console.log('Selecting composition...');
    
    // First get all compositions to get the actual one we want to modify
    const compositions = await getCompositions(bundled);
    const tiktokComposition = compositions.find(comp => comp.id === 'TiktokVideo');
    
    if (tiktokComposition) {
      // Modify the composition duration to match our audio segments
      tiktokComposition.durationInFrames = Math.ceil(estimatedDurationInFrames);
    } else {
      console.error('Could not find TiktokVideo composition!');
    }
    
    // Now select the composition with our inputs
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'TiktokVideo',
      inputProps,
    });
    
    // Override the composition duration with our calculated value
    // This is the key step to ensure the correct duration is used
    composition.durationInFrames = Math.ceil(estimatedDurationInFrames);
    
    // Ensure we have a valid output path
    const finalOutputPath = outputPath || path.join(process.cwd(), 'output', 'video.mp4');
    
    // Render the video
    console.log(`Rendering video to: ${finalOutputPath}`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: finalOutputPath,
      inputProps,
      onProgress: (progress) => {
        // Solo mostrar progreso en múltiplos de 5%
        const percentage = Math.round(progress.progress * 100);
        if (percentage % 5 === 0 && percentage > 0) {
          console.log(`Rendering progress: ${progress.renderedFrames} frames (${percentage}%)`);
        }
      },
    });
    
    console.log(`Video rendered to ${finalOutputPath}`);
    return finalOutputPath;
  } catch (error) {
    console.error('Error rendering video:', error);
    throw error;
  }
}
