#!/usr/bin/env node

/**
 * Amazon Afiliados Auto Runner
 * 
 * This script runs both the Elle scraping and MDX generation scripts sequentially.
 * It's designed to be executed by a cron job on your local machine.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

// Define paths to our scripts
const SCRAPING_SCRIPT = path.join(__dirname, 'scraping', 'Elle', 'index.js');
const MDX_SCRIPT = path.join(__dirname, 'generate-mdx', 'index.js');
const LOG_FILE = path.join(__dirname, 'cron.log');

// Helper function to log messages to both console and log file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Helper function to run a script with Node.js
async function runScript(scriptPath, description) {
  try {
    log(`🚀 Starting ${description}...`);
    log(`Running script: ${scriptPath}`);
    
    // Increase maxBuffer to 10MB (default is 1MB)
    const options = {
      maxBuffer: 100 * 1024 * 1024 // 100MB buffer
    };
    
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, options);
    
    if (stderr) {
      log(`⚠️ Script warning: ${stderr}`);
    }
    
    log(`✅ ${description} completed successfully`);
    log(`Output: ${stdout.substring(0, 500)}${stdout.length > 500 ? '...(truncated)' : ''}`);
    return { success: true, output: stdout };
  } catch (error) {
    log(`❌ Error executing ${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main function to run both scripts sequentially
async function main() {
  log('='.repeat(50));
  log('🤖 Amazon Afiliados Auto Runner started');
  log('='.repeat(50));
  
  try {
    // Step 1: Run the scraping script
    const scrapeResult = await runScript(SCRAPING_SCRIPT, 'Elle scraping');
    
    if (!scrapeResult.success) {
      log('❌ Scraping failed, aborting MDX generation');
      process.exit(1);
    }
    
    // Step 2: Run the MDX generation script
    const mdxResult = await runScript(MDX_SCRIPT, 'MDX generation');
    
    if (!mdxResult.success) {
      log('❌ MDX generation failed');
      process.exit(1);
    }
    
    log('='.repeat(50));
    log('✅ All tasks completed successfully');
    log('='.repeat(50));
    
  } catch (error) {
    log(`❌ Fatal error in auto runner: ${error.message}`);
    process.exit(1);
  }
}

main();
