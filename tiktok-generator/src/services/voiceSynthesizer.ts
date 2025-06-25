import path from 'path';
import fs from 'fs-extra';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Define the script structure expected from the GPT model
export interface ScriptStructure {
  intro: string;
  productos: string[];
  outro: string;
}

// Define the audio segment structure
export interface AudioSegment {
  type: 'intro' | 'product' | 'outro';
  text: string;
  audioPath: string;
  audioBase64: string;
  index?: number; // For product segments to identify which product
}

// Define the ElevenLabs API integration for a single segment
async function synthesizeSegment(
  text: string, 
  elevenlabs: ElevenLabsClient, 
  voiceId: string, 
  outputPath: string
): Promise<{
  audioPath: string;
  audioBase64: string;
}> {
  try {
    // Get the audio as binary data
    const audioData = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.5,       // Mid-range stability for more expressiveness
        similarityBoost: 0.8, // Higher value for more emphasis
        style: 0.7,          // Higher style for more dynamic speech
        useSpeakerBoost: true,
        speed: 1.2           // Maximum allowed speed (1.2)
      }
    });

    const chunks = [];
    const reader = audioData.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Write the audio file
    await fs.writeFile(outputPath, buffer);
    
    // Return the audio path and base64 data
    return {
      audioPath: outputPath,
      audioBase64: buffer.toString('base64')
    };
  } catch (error: any) {
    console.error('Error synthesizing segment:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function synthesizeVoice(script: string, outputPath?: string): Promise<string> {
  // Check if the script is a JSON string
  let parsedScript: ScriptStructure | null = null;
  try {
    parsedScript = JSON.parse(script);
    if (parsedScript && typeof parsedScript === 'object' && parsedScript.intro && Array.isArray(parsedScript.productos) && parsedScript.outro) {
      console.log('Detected JSON script format, using structured audio synthesis...');
      const result = await synthesizeStructuredVoice(parsedScript, path.dirname(outputPath || path.resolve(process.cwd(), 'output')));
      return result.segments[0].audioPath; // Return the first audio path for backward compatibility
    }
  } catch (e) {
    // Not a JSON, continue with the normal process
  }

  try {
    // Check if the API key exists
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not defined in environment variables');
    }

    // Use the provided output path or create a default one
    let finalOutputPath = outputPath;
    
    if (!finalOutputPath) {
      // Create default output directory if it doesn't exist
      const outputDir = path.resolve(process.cwd(), 'output');
      await fs.ensureDir(outputDir);
      
      // Set default output file path
      finalOutputPath = path.join(outputDir, `audio.mp3`);
    }
    
    // Ensure the directory exists
    await fs.ensureDir(path.dirname(finalOutputPath));

    // Initialize ElevenLabs client
    const elevenlabs = new ElevenLabsClient({
      apiKey
    });

    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'a0MaQpDjx7p7bZmqzFp1'; // Default voice ID
    
    // Synthesize voice using ElevenLabs API
    console.log('Generating audio with ElevenLabs...');
    
    const result = await synthesizeSegment(script, elevenlabs, voiceId, finalOutputPath);
    console.log(`Audio file saved to ${finalOutputPath}`);
    
    return finalOutputPath;
  } catch (error: any) {
    console.error('Error synthesizing voice:', error);
    
    // Try to extract detailed error information from the ElevenLabs API response
    if (error.rawResponse) {
      console.error(`Status code: ${error.statusCode}`);
      console.error(`Headers: ${JSON.stringify(error.rawResponse.headers)}`);
      
      // Try to read the error body if it's a stream
      if (error.body && error.body.getReader) {
        try {
          console.log('Attempting to read error response body...');
          const reader = error.body.getReader();
          const chunks: Uint8Array[] = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          
          if (chunks.length > 0) {
            const buffer = Buffer.concat(chunks);
            const errorBody = buffer.toString('utf-8');
            console.error(`Error response body: ${errorBody}`);
          } else {
            console.error('Error response body was empty');
          }
        } catch (readError) {
          console.error('Failed to read error response body:', readError);
        }
      }
    }
    return 'error';
  }
}

// Process a structured script into separate audio segments
export async function synthesizeStructuredVoice(
  script: ScriptStructure, 
  outputDir: string
): Promise<{segments: AudioSegment[], combinedAudioPath?: string}> {
  try {
    // Check if the API key exists
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not defined in environment variables');
    }

    // Ensure the output directory exists
    await fs.ensureDir(outputDir);

    // Initialize ElevenLabs client
    const elevenlabs = new ElevenLabsClient({
      apiKey
    });

    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'a0MaQpDjx7p7bZmqzFp1'; // Default voice ID
    
    console.log('Generating segmented audio with ElevenLabs...');
    
    // Create an array to hold all audio segments
    const segments: AudioSegment[] = [];
    
    // 1. Process intro
    console.log('Generating intro audio...');
    const introPath = path.join(outputDir, 'intro.mp3');
    const introResult = await synthesizeSegment(script.intro, elevenlabs, voiceId, introPath);
    segments.push({
      type: 'intro',
      text: script.intro,
      audioPath: introResult.audioPath,
      audioBase64: introResult.audioBase64
    });
    
    // 2. Process each product
    console.log(`Generating audio for ${script.productos.length} products...`);
    for (let i = 0; i < script.productos.length; i++) {
      const productText = script.productos[i];
      const productPath = path.join(outputDir, `product_${i + 1}.mp3`);
      const productResult = await synthesizeSegment(productText, elevenlabs, voiceId, productPath);
      segments.push({
        type: 'product',
        index: i,
        text: productText,
        audioPath: productResult.audioPath,
        audioBase64: productResult.audioBase64
      });
    }
    
    // 3. Process outro
    console.log('Generating outro audio...');
    const outroPath = path.join(outputDir, 'outro.mp3');
    const outroResult = await synthesizeSegment(script.outro, elevenlabs, voiceId, outroPath);
    segments.push({
      type: 'outro',
      text: script.outro,
      audioPath: outroResult.audioPath,
      audioBase64: outroResult.audioBase64
    });
    
    console.log(`Generated ${segments.length} audio segments successfully`);
    return { segments };
    
  } catch (error: any) {
    console.error('Error synthesizing structured voice:', error);
    throw error;
  }
}
