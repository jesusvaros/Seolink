#!/usr/bin/env node
import * as dotenv from 'dotenv';
import path from 'path';
import { processMarkdown } from './services/mdxProcessor.js';
import { generateScript } from './services/scriptGenerator.js';
import { synthesizeStructuredVoice, AudioSegment } from './services/voiceSynthesizer.js';
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
    
    // Step 3: Generate audio with segmented approach
    let audioSegments: AudioSegment[];
    
    // Parse the script as JSON 
    const scriptObj = JSON.parse(script);
    console.log('Processing structured script with JSON format');
    
    // Check if segmented audio files already exist
    if (await fs.pathExists(path.join(outputDir, 'intro.mp3')) && 
        await fs.pathExists(path.join(outputDir, `product_${scriptObj.productos.length}.mp3`)) && 
        await fs.pathExists(path.join(outputDir, 'outro.mp3'))) {
      console.log('✅ Segmented audio files already exist, using them...');
      
      // Reconstruct audio segments from existing files
      audioSegments = [];
      
      // Add intro
      audioSegments.push({
        type: 'intro',
        text: scriptObj.intro,
        audioPath: path.join(outputDir, 'intro.mp3'),
        audioBase64: (await fs.readFile(path.join(outputDir, 'intro.mp3'))).toString('base64')
      });
      
      // Add products
      for (let i = 0; i < scriptObj.productos.length; i++) {
        audioSegments.push({
          type: 'product',
          index: i,
          text: scriptObj.productos[i],
          audioPath: path.join(outputDir, `product_${i + 1}.mp3`),
          audioBase64: (await fs.readFile(path.join(outputDir, `product_${i + 1}.mp3`))).toString('base64')
        });
      }
      
      // Add outro
      audioSegments.push({
        type: 'outro',
        text: scriptObj.outro,
        audioPath: path.join(outputDir, 'outro.mp3'),
        audioBase64: (await fs.readFile(path.join(outputDir, 'outro.mp3'))).toString('base64')
      });
      
    } else {
      console.log('🎙️ Generating segmented audio...');
      const result = await synthesizeStructuredVoice(scriptObj, outputDir);
      audioSegments = result.segments;
    }
    
    // Step 4: Generate or use existing video
    if (await fs.pathExists(videoPath)) {
      console.log('✅ Video already exists, skipping rendering...');
    } else {
      console.log('🌄 Rendering video...');
      console.log('Productos disponibles en MDX:', processedMarkdown.products.length);
      if (processedMarkdown.products.length > 0) {
        console.log('Primer producto:', processedMarkdown.products[0].name);
      }
      
      const outputPath = await renderVideo({
        images: processedMarkdown.images,
        slideImages: processedMarkdown.slideImages,
        script,
        audioSegments, // Pass the audio segments
        outputDir,
        metadata: {
          title: processedMarkdown.title || '',
          description: processedMarkdown.description || '',
          products: processedMarkdown.products // Pasar los productos del MDX correctamente
        },
        outputPath: videoPath,
      });
      
      if (outputPath !== videoPath && await fs.pathExists(outputPath)) {
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
      (await fs.readdir(outputRootDir)).filter((file: string) => 
        fs.statSync(path.join(outputRootDir, file)).isDirectory()
      ) : [];
    
    console.log(`Found ${existingOutputs.length} existing output folders:`);
    existingOutputs.forEach((folder: string) => console.log(`- ${folder}`));
    
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
