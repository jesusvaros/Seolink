import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { getCompositions } from '@remotion/renderer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import os from 'os';
import { WebpackOverrideFn } from '@remotion/bundler';
import { AudioSegment } from './voiceSynthesizer.js';

// ES modules compatibility: Create equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      description: metadata?.description || ''
    };
    
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
      entryPoint: path.join(__dirname, '../remotion/index.js'),
      webpackOverride,
    });

    // Get the composition
    console.log('Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'TiktokVideo',
      inputProps,
    });
    
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
      // Add progress callback for better visibility
      onProgress: (progress) => {
        console.log(`Rendering progress: ${progress.renderedFrames} frames (${Math.round(progress.progress * 100)}%)`);
      },
    });
    
    console.log(`Video rendered to ${finalOutputPath}`);
    return finalOutputPath;
  } catch (error) {
    console.error('Error rendering video:', error);
    throw error;
  }
}
