import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Define paths to our scripts
const SCRAPING_SCRIPT = path.join(process.cwd(), '../../scraping/Elle/index.js');
const MDX_SCRIPT = path.join(process.cwd(), '../../generate-mdx/index.js');

// Helper function to run a script with Node.js
async function runScript(scriptPath) {
  try {
    console.log(`Running script: ${scriptPath}`);
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
    
    if (stderr) {
      console.error(`Script error: ${stderr}`);
    }
    
    console.log(`Script output: ${stdout}`);
    return { success: true, output: stdout };
  } catch (error) {
    console.error(`Error executing script: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function GET(request) {
  // Check for authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get the URL to extract task parameter
  const { searchParams } = new URL(request.url);
  const task = searchParams.get('task') || 'scrape';
  
  try {
    if (task === 'scrape') {
      // Run the scraping script
      const scrapeResult = await runScript(SCRAPING_SCRIPT);
      
      if (!scrapeResult.success) {
        return NextResponse.json({ 
          error: 'Scraping failed', 
          details: scrapeResult.error 
        }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, task: 'scrape' });
    }
    
    if (task === 'mdx') {
      // Run the MDX generation script
      const mdxResult = await runScript(MDX_SCRIPT);
      
      if (!mdxResult.success) {
        return NextResponse.json({ 
          error: 'MDX generation failed', 
          details: mdxResult.error 
        }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, task: 'mdx' });
    }
    
    // If no valid task was specified
    return NextResponse.json({ 
      error: 'Invalid task specified. Use "scrape" or "mdx".' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in cron handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 });
  }
}
