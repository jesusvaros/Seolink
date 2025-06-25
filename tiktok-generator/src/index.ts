#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import { processMarkdown } from './services/mdxProcessor.js';
import { generateScript } from './services/scriptGenerator.js';
import { synthesizeVoice } from './services/voiceSynthesizer.js';
import { renderVideo } from './services/videoRenderer.js';
import fs from 'fs-extra';
import { glob } from 'glob';

// Load environment variables
dotenv.config();

async function processFile(mdxFilePath: string) {
  try {
    // Generate base filename without extension
    const baseName = path.basename(mdxFilePath, path.extname(mdxFilePath));
    
    // Create dedicated output directory for this file
    const outputDir = path.resolve(process.cwd(), 'output', baseName);
    await fs.ensureDir(outputDir);
    
    // Define output paths
    const scriptPath = path.join(outputDir, 'script.txt');
    const audioPath = path.join(outputDir, 'audio.mp3');
    const videoPath = path.join(outputDir, 'video.mp4');
    
    // Variables to store generated assets
    let script;
    let actualAudioPath;
    
    // Step 1: Process the MDX file (always needed for metadata)
    console.log(`📄 Processing MDX file: ${baseName}...`);
    const processedMarkdown = await processMarkdown(mdxFilePath);
    
    // Step 2: Generate or load script
    if (await fs.pathExists(scriptPath)) {
      console.log('✅ Script already exists, loading...');
      script = await fs.readFile(scriptPath, 'utf-8');
    } else {
      console.log('✍️ Generating script...');
      script = await generateScript(processedMarkdown, scriptPath);
    }
    
    // Step 3: Generate or use existing audio
    if (await fs.pathExists(audioPath)) {
      console.log('✅ Audio file already exists, using it...');
      actualAudioPath = audioPath;
    } else if (script) {
      console.log('🎙️ Synthesizing voice...');
      // Pass the correct audio path to synthesizeVoice to avoid multiple audio files
      actualAudioPath = await synthesizeVoice(script, audioPath);
    } else {
      throw new Error('No script available for audio synthesis');
    }
    
    // Step 4: Generate or use existing video
    if (await fs.pathExists(videoPath)) {
      console.log('✅ Video already exists, skipping rendering...');
      return videoPath;
    } else {
      console.log('🎬 Rendering video...');
      const outputPath = await renderVideo({
        images: processedMarkdown.images,
        audioPath: actualAudioPath,
        script,
        metadata: processedMarkdown.metadata,
      });
      
      // Copy video to dedicated directory if needed
      if (outputPath !== videoPath) {
        await fs.copy(outputPath, videoPath);
      }
      
      return videoPath;
    }
  } catch (error) {
    console.error(`Error processing file ${mdxFilePath}:`, error);
    return null;
  }
}

async function main() {
  try {
    // Use hardcoded defaults for simpler usage
    const inputPath = '/Users/aa/CascadeProjects/amazon-afiliados/content/posts';
    const batchSize = 1; // Process just one file at a time
    const startIndex = 0; // Always start with the first unprocessed file
    
    console.log(`Using input path: ${inputPath}`);
    
    // Check if input exists
    if (!await fs.pathExists(inputPath)) {
      console.error(`Input path does not exist: ${inputPath}`);
      process.exit(1);
    }
    
    // Get MDX files
    let mdxFiles: string[] = [];
    const stats = await fs.stat(inputPath);
    
    if (stats.isDirectory()) {
      // Process all .mdx files in the directory
      console.log(`Finding MDX files in directory: ${inputPath}`);
      mdxFiles = await glob(path.join(inputPath, '**/*.mdx'));
    } else if (stats.isFile() && path.extname(inputPath).toLowerCase() === '.mdx') {
      // Process single file
      mdxFiles = [inputPath];
    } else {
      console.error('Input must be a directory containing MDX files or an MDX file');
      process.exit(1);
    }
    
    // Check for existing output folders
    const outputRootDir = path.resolve(process.cwd(), 'output');
    const existingOutputs = await fs.pathExists(outputRootDir) ? 
      (await fs.readdir(outputRootDir)).filter(file => 
        fs.statSync(path.join(outputRootDir, file)).isDirectory()
      ) : [];
    
    console.log(`Found ${existingOutputs.length} existing output folders:`);
    existingOutputs.forEach(folder => console.log(`- ${folder}`));
    
    // Filter files that already have complete outputs (video.mp4)
    const pendingFiles: string[] = [];
    const completeFiles: string[] = [];
    
    for (const filePath of mdxFiles) {
      const baseName = path.basename(filePath, path.extname(filePath));
      const videoPath = path.join(outputRootDir, baseName, 'video.mp4');
      
      if (await fs.pathExists(videoPath)) {
        completeFiles.push(filePath);
      } else {
        pendingFiles.push(filePath);
      }
    }
    
    console.log(`Found ${mdxFiles.length} total MDX files:`);
    console.log(`- ${completeFiles.length} with complete videos`);
    console.log(`- ${pendingFiles.length} pending processing`);
    
    // Apply batch limits
    const filesToProcess = pendingFiles
      .slice(startIndex, startIndex + batchSize);
      
    if (filesToProcess.length === 0) {
      console.log('No files to process in this batch');
      process.exit(0);
    }
    
    console.log(`Processing ${filesToProcess.length} files in this batch:`);
    filesToProcess.forEach((file, idx) => {
      console.log(`${idx + 1}. ${path.basename(file)}`);
    });
    
    // Process selected files
    const results = [];
    for (const filePath of filesToProcess) {
      console.log(`\n===== Processing ${path.basename(filePath)} =====`);
      const outputPath = await processFile(filePath);
      if (outputPath) {
        results.push({
          file: path.basename(filePath),
          outputPath
        });
      }
    }
    
    // Summary
    console.log('\n===== Summary =====');
    
    if (results.length > 0) {
      const result = results[0]; // We're only processing one file
      console.log(`✅ Successfully processed: ${result.file}`);
      console.log(`📺 Video saved to: ${result.outputPath}`);
    } else {
      console.log('❌ No files were processed');
    }
    
    // Show info about remaining files
    if (pendingFiles.length > 1) {
      console.log(`\n📋 ${pendingFiles.length - 1} files remaining to process`);
      console.log(`\n👉 Run 'npm run start' again to process the next file`);
    } else if (pendingFiles.length === 1 && results.length === 0) {
      console.log('\n❗ Could not process the file. Please check errors above.');
    } else {
      console.log('\n🎉 All files have been processed!');
    }
  } catch (error) {
    console.error('Error creating videos:', error);
    process.exit(1);
  }
}

main();
