import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { getCompositions } from '@remotion/renderer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import os from 'os';
import { WebpackOverrideFn } from '@remotion/bundler';

// ES modules compatibility: Create equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VideoRenderOptions {
  images: string[];
  audioPath: string;
  script: string;
  metadata: Record<string, any>;
}

export async function renderVideo(options: VideoRenderOptions): Promise<string> {
  try {
    const { images, audioPath, script, metadata } = options;
    
    // Read audio file into memory and encode as base64
    const audioDir = path.dirname(audioPath);
    const outputPath = path.join(audioDir, 'video.mp4');
    
    console.log(`Reading audio file: ${audioPath}`);
    const audioBuffer = await fs.readFile(audioPath);
    const audioBase64 = audioBuffer.toString('base64');
    console.log(`Audio file read into memory: ${audioBuffer.length} bytes`);
    console.log(`Video will be saved to: ${outputPath}`);
    
    // Bundle the video components
    console.log('Bundling video components...');
    
    // Important: Use the JS file from dist, not the TS source file
    const entryPointPath = path.join(process.cwd(), 'dist/remotion/index.js');
    console.log(`Using Remotion entry point: ${entryPointPath}`);
    
    // Create a simpler bundle configuration
    const bundleOptions = {
      entryPoint: entryPointPath,
      // Enable verbose output for debugging
      verbose: true,
    };
    
    console.log('Bundle options:', bundleOptions);
    const bundled = await bundle(bundleOptions);
    
    // Pass the base64 audio data instead of a file path
    const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;
    
    const inputProps = {
      images,
      audioData: audioDataUrl, // Pass base64 audio data
      script,
      title: metadata.title || 'TikTok Video',
      description: metadata.description || '',
    };
    
    console.log('Using audio data URL instead of file path');
    
    console.log('Using input props:', inputProps);
    
    // Get the composition
    console.log('Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'TiktokVideo',
      inputProps,
      envVariables: {
        // Pass env variables that might be needed
        REMOTION_AUDIO_DATA: audioDataUrl,
      },
    });
    
    // Render the video
    console.log('Rendering video...');
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      // Add progress callback for better visibility
      onProgress: (progress) => {
        console.log(`Rendering progress: ${progress.renderedFrames} frames (${Math.round(progress.progress * 100)}%)`);
      },
    });
    
    console.log(`Video rendered to ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error rendering video:', error);
    throw error;
  }
}
