import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

let currentScriptProcess = null; // Define at module level

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { action, url: targetUrl } = req.body;

  if ((action === 'scrape' || action === 'generate') && currentScriptProcess) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write('Error: A script is already running. Please wait for it to complete or interrupt it.\n');
    return res.end();
  }

  let scriptPath = '';
  let scriptArgs = [];
  let scriptCwd = process.cwd();

  if (action === 'scrape') {
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required for scraping action' });
    }
    try {
      const urlsDir = path.join(scriptCwd, 'generate-mdx', 'urls');
      // Ensure the directory exists (it should from previous steps, but good practice)
      if (!fs.existsSync(urlsDir)) {
        fs.mkdirSync(urlsDir, { recursive: true });
      }
      const newUrlFileName = `scraped_url_${Date.now()}.json`;
      const newUrlFilePath = path.join(urlsDir, newUrlFileName);
      fs.writeFileSync(newUrlFilePath, JSON.stringify([targetUrl]));
      // Add a small log to the script output that the URL was saved
      res.write(`[INFO] Saved URL to ${newUrlFileName}\n`); 
    } catch (error) {
      console.error('Error saving scraped URL to file:', error);
      // Optionally, inform the client, but continue with scraping if possible
      res.write(`[WARN] Could not save URL to file: ${error.message}\n`);
    }

    scriptPath = path.join(scriptCwd, 'scraping', 'Elle', 'scrape-elle-search.js');
    scriptArgs = [targetUrl];
    scriptCwd = path.join(scriptCwd, 'scraping', 'Elle');
  } else if (action === 'generate') {
    scriptPath = path.join(scriptCwd, 'generate-mdx', 'index.js');
    scriptCwd = path.join(scriptCwd, 'generate-mdx');
  } else if (action === 'get_url_stats') {
    try {
      const urlsDir = path.join(scriptCwd, 'generate-mdx', 'urls');
      const processedUrlsPath = path.join(urlsDir, 'processed-urls.json');
      
      let processedUrlsList = fs.existsSync(processedUrlsPath) ? JSON.parse(fs.readFileSync(processedUrlsPath, 'utf-8')) : [];
      // const processedUrlsCount = processedUrlsList.length; // This will be derived from generatedPostsDetails now for consistency if we replace the display

      const allFilesInUrlsDir = fs.readdirSync(urlsDir);
      const sourceUrlFiles = allFilesInUrlsDir.filter(
        (file) => file.endsWith('.json') && file !== 'processed-urls.json'
      );

      let totalUrlsInSourceFiles = 0;
      let allSourceUrlsFromFiles = [];
      let manuallySubmittedUrls = [];
      for (const fileName of sourceUrlFiles) {
        try {
          const sourceFilePath = path.join(urlsDir, fileName);
          const sourceFileContent = fs.readFileSync(sourceFilePath, 'utf8');
          const urlsInFile = JSON.parse(sourceFileContent);
          if (Array.isArray(urlsInFile)) {
            totalUrlsInSourceFiles += urlsInFile.length;
            allSourceUrlsFromFiles.push(...urlsInFile);
            if (fileName.startsWith('scraped_url_')) {
              manuallySubmittedUrls.push(...urlsInFile);
            }
          }
        } catch (e) {
          console.error(`Error reading or parsing source URL file ${fileName}:`, e);
          // Optionally skip this file or handle error
        }
      }

      const pendingUrlsCount = totalUrlsInSourceFiles - processedUrlsList.length;

      // Get generated post details from categories.json
      const categoriesFilePath = path.join(process.cwd(), 'content', 'categories', 'categories.json');
      let generatedPostsCount = 0;
      let generatedPostsDetails = [];

      if (fs.existsSync(categoriesFilePath)) {
        try {
          const categoriesData = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf-8'));
          for (const categoryKey in categoriesData) {
            if (Array.isArray(categoriesData[categoryKey])) {
              categoriesData[categoryKey].forEach(post => {
                if (post && post.title && post.slug) {
                  generatedPostsDetails.push({ title: post.title, slug: post.slug });
                }
              });
            }
          }
          generatedPostsCount = generatedPostsDetails.length;
        } catch (e) {
          console.error('Error parsing categories.json:', e);
          // Keep generatedPostsCount as 0 and generatedPostsDetails as [] if parsing fails
        }
      } else {
        console.log('categories.json not found, generated posts will be empty.');
      }

      return res.status(200).json({
        totalUrlsInSourceFiles,
        pendingUrlsCount,
        allSourceUrlsFromFiles,
        manuallySubmittedUrls,
        generatedPostsCount,
        generatedPostsDetails,
      });
    } catch (error) {
      console.error('Error fetching URL stats:', error);
      return res.status(500).json({ error: 'Failed to fetch URL stats', details: error.message });
    }
  } else if (action === 'kill_script') {
    if (currentScriptProcess) {
      console.log('Attempting to kill script process ID:', currentScriptProcess.pid);
      try {
        process.kill(-currentScriptProcess.pid, 'SIGTERM'); // Send to process group
        res.status(200).json({ message: 'Script interrupt signal sent to process group. Check console for script termination.' });
      } catch (killError) {
        console.error('Error attempting to kill process group:', killError);
        try {
            currentScriptProcess.kill('SIGTERM'); // Fallback to killing just the main process
            res.status(200).json({ message: 'Script interrupt signal sent (fallback to main process). Check console for script termination.' });
        } catch (singleKillError) {
            console.error('Error attempting to kill single process:', singleKillError);
            res.status(500).json({ error: 'Failed to send interrupt signal.', details: singleKillError.message });
        }
      }
      // currentScriptProcess is set to null by 'close' or 'error' event handlers
    } else {
      res.status(400).json({ message: 'No script currently running to interrupt.' });
    }
    return; // End response for kill_script action
  } else if (action !== 'scrape' && action !== 'generate') { // If not any known action that streams
    res.status(400).json({ error: 'Invalid action or action does not stream output.' });
    return;
  }

  // For 'scrape' or 'generate' actions, proceed to spawn process and stream output
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  const scriptProcess = spawn('node', [scriptPath, ...scriptArgs], { cwd: scriptCwd, detached: false });
  currentScriptProcess = scriptProcess;

  res.write(`Starting script: ${action}...\n`);
  if (targetUrl && action === 'scrape') res.write(`URL: ${targetUrl}\n`);
  res.write(`Script path: ${scriptPath}\n`);
  if (scriptArgs.length > 0) res.write(`Arguments: ${scriptArgs.join(' ')}\n`);
  res.write(`Working directory: ${scriptCwd}\n\n`);

  scriptProcess.stdout.on('data', (data) => {
    res.write(data);
  });

  scriptProcess.stderr.on('data', (data) => {
    res.write(`STDERR: ${data}`);
  });

  scriptProcess.on('close', (code) => {
    res.write(`Script finished with code ${code}\n`);
    currentScriptProcess = null;
    if (!res.writableEnded) {
      res.end();
    }
  });

  scriptProcess.on('error', (err) => {
    console.error('Failed to start or run subprocess.', err);
    currentScriptProcess = null;
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start script', details: err.message });
    } else if (!res.writableEnded) {
      res.write(`\nERROR during script execution: ${err.message}\n`);
      res.end();
    }
  });

  // Handle client closing connection (e.g. browser refresh/close)
  req.on('close', () => {
    console.log('Client disconnected, attempting to clean up script...');
    if (currentScriptProcess && !currentScriptProcess.killed) {
      console.log(`Killing script process ${currentScriptProcess.pid} due to client disconnect.`);
      try {
        process.kill(-currentScriptProcess.pid, 'SIGTERM'); // Kill the process group
      } catch (e) {
        console.error('Error killing process group on client disconnect:', e);
        try {
            currentScriptProcess.kill('SIGTERM'); // Fallback
        } catch (e2) {
            console.error('Error killing main process on client disconnect:', e2);
        }
      }
      currentScriptProcess = null;
    }
  });
}
