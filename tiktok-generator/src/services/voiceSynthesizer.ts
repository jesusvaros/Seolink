import path from 'path';
import fs from 'fs-extra';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Define the ElevenLabs API integration
export async function synthesizeVoice(script: string, outputPath?: string): Promise<string> {
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
    
    // Get the audio as binary data
    // Using voice settings within valid ranges
    // Based on error message, speed must be between 0.7 and 1.2
    const audioData = await elevenlabs.textToSpeech.convert(voiceId, {
      text: script,
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
    await fs.writeFile(finalOutputPath, buffer);
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
