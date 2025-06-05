import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { action, url: targetUrl } = req.body;

  let scriptPath;
  let scriptArgs = [];
  let scriptCwd;

  const projectRoot = process.cwd();

  if (action === 'scrape') {
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required for scraping action' });
    }
    // Path to the user's scrape script
    scriptPath = path.join(projectRoot, 'scraping', 'Elle', 'scrape-elle-search.js');
    scriptArgs = [targetUrl]; // Assuming the script takes URL as a command-line argument
    scriptCwd = path.join(projectRoot, 'scraping', 'Elle');
  } else if (action === 'generate') {
    // Path to the user's generate script (test-script.js as specified)
    scriptPath = path.join(projectRoot, 'generate-mdx', 'test-script.js');
    // scriptArgs = []; // No args assumed for this one
    scriptCwd = path.join(projectRoot, 'generate-mdx');
  } else {
    return res.status(400).json({ error: 'Invalid action specified' });
  }

  // Set headers for streaming the response
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache, no-transform'); // Disable caching for live updates
  res.setHeader('X-Accel-Buffering', 'no'); // For Nginx environments, to ensure streaming

  try {
    const scriptProcess = spawn('node', [scriptPath, ...scriptArgs], { cwd: scriptCwd || projectRoot });

    // Send initial status messages
    res.write(`Starting script: ${action}...\n`);
    if (targetUrl && action === 'scrape') res.write(`URL: ${targetUrl}\n`);
    res.write(`Script path: ${scriptPath}\n`);
    if (scriptArgs.length > 0) res.write(`Arguments: ${scriptArgs.join(' ')}\n`);
    res.write(`Working directory: ${scriptCwd || projectRoot}\n\n`);

    // Stream stdout
    scriptProcess.stdout.on('data', (data) => {
      res.write(data);
    });

    // Stream stderr
    scriptProcess.stderr.on('data', (data) => {
      res.write(`STDERR: ${data}`);
    });

    // Handle script completion
    scriptProcess.on('close', (code) => {
      res.write(`\nScript finished with code ${code}\n`);
      res.end(); // End the response stream
    });

    // Handle errors in spawning the process
    scriptProcess.on('error', (err) => {
      console.error('Failed to start subprocess.', err);
      if (!res.headersSent) {
        // If headers not sent, we can still send a proper error status
        res.status(500).json({ error: 'Failed to start script', details: err.message });
      } else {
        // If headers already sent, append error to the stream
        res.write(`\nERROR starting script: ${err.message}\n`);
        res.end();
      }
    });

  } catch (error) {
    console.error('Error in API route:', error);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } else {
        res.write(`\nINTERNAL SERVER ERROR: ${error.message}\n`);
        res.end();
    }
  }
}
