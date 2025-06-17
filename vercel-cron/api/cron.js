import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Define paths to our scripts
const SCRAPING_SCRIPT = path.join(process.cwd(), '..', 'scraping', 'Elle', 'index.js');
const MDX_SCRIPT = path.join(process.cwd(), '..', 'generate-mdx', 'index.js');

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

export default async function handler(req, res) {
  // Check for authorization header (optional but recommended)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const task = req.query.task || 'all';
    
    if (task === 'scrape' || task === 'all') {
      // Run the scraping script
      const scrapeResult = await runScript(SCRAPING_SCRIPT);
      
      if (!scrapeResult.success) {
        return res.status(500).json({ error: 'Scraping failed', details: scrapeResult.error });
      }
      
      // If only scraping was requested, return success
      if (task === 'scrape') {
        return res.status(200).json({ success: true, task: 'scrape' });
      }
      
    }
    
    // if (task === 'mdx') {
    //   // Run the MDX generation script
    //   const mdxResult = await runScript(MDX_SCRIPT);
      
    //   if (!mdxResult.success) {
    //     return res.status(500).json({ error: 'MDX generation failed', details: mdxResult.error });
    //   }
      
    //   return res.status(200).json({ success: true, task: 'mdx' });
    // }
    
    // If no valid task was specified
    return res.status(400).json({ error: 'Invalid task specified. Use "scrape", "mdx", or "all".' });
    
  } catch (error) {
    console.error('Error in cron handler:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
