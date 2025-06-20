import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { isAuthenticated } from '../../middleware/authMiddleware';

let currentScriptProcess = null; // Define at module level

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  // Check if the user is authenticated
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to access this feature.' });
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
      const consolidatedFilePath = path.join(urlsDir, 'scraped_urls.json');
      
      // Read existing URLs or create empty array
      let existingUrls = [];
      if (fs.existsSync(consolidatedFilePath)) {
        try {
          existingUrls = JSON.parse(fs.readFileSync(consolidatedFilePath, 'utf8'));
          if (!Array.isArray(existingUrls)) {
            existingUrls = [];
          }
        } catch (readError) {
          console.error('Error reading scraped_urls.json:', readError);
          existingUrls = [];
        }
      }
      
      // Add new URL if it's not already in the list
      if (!existingUrls.includes(targetUrl)) {
        existingUrls.push(targetUrl);
        fs.writeFileSync(consolidatedFilePath, JSON.stringify(existingUrls, null, 2));
        res.write(`[INFO] Added URL to scraped_urls.json (total: ${existingUrls.length} URLs)\n`);
      } else {
        res.write(`[INFO] URL already exists in scraped_urls.json (total: ${existingUrls.length} URLs)\n`);
      }
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
    // Keep the working directory at the project root, not in generate-mdx
    // This ensures content is generated in /content/ not in /generate-mdx/content/
    scriptCwd = process.cwd();
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
      let duplicateUrls = [];
      let duplicateUrlsCount = 0;
      let domainCounts = {};
      
      // Track URL occurrences to find duplicates
      const urlOccurrences = {};
      
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
            
            // Track URL occurrences for duplicate detection
            urlsInFile.forEach(url => {
              if (typeof url === 'string') {
                urlOccurrences[url] = (urlOccurrences[url] || 0) + 1;
                
                // Count domains
                try {
                  const domain = new URL(url).hostname;
                  domainCounts[domain] = (domainCounts[domain] || 0) + 1;
                } catch (e) {
                  // Invalid URL, skip domain counting
                }
              }
            });
          }
        } catch (e) {
          console.error(`Error reading or parsing source URL file ${fileName}:`, e);
          // Optionally skip this file or handle error
        }
      }
      
      // Find duplicate URLs (appear more than once)
      Object.entries(urlOccurrences)
        .filter(([_, count]) => count > 1)
        .forEach(([url, count]) => {
          duplicateUrls.push([url, count]);
          duplicateUrlsCount++;
        });
      
      // Find orphaned URLs (in processed but not in source)
      const uniqueSourceUrls = [...new Set(allSourceUrlsFromFiles.filter(url => typeof url === 'string'))];
      const orphanedUrls = processedUrlsList.filter(url => !uniqueSourceUrls.includes(url));
      const orphanedUrlsCount = orphanedUrls.length;
      
      const uniqueUrlsCount = uniqueSourceUrls.length;
      const processedUrlsCount = processedUrlsList.length;
      const pendingUrlsCount = uniqueUrlsCount - processedUrlsCount;

      // Get generated post details from categories.json
      const categoriesFilePath = path.join(process.cwd(), 'content', 'categories', 'categories.json');
      let generatedPostsCount = 0;
      let generatedPostsDetails = [];

      if (fs.existsSync(categoriesFilePath)) {
        try {
          const categoriesData = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf-8'));
          
          // Ensure categoriesData is an object
          if (categoriesData && typeof categoriesData === 'object') {
            for (const categoryKey in categoriesData) {
              // Ensure the category contains an array
              if (categoriesData[categoryKey] && Array.isArray(categoriesData[categoryKey])) {
                categoriesData[categoryKey].forEach(post => {
                  try {
                    // Only process valid post objects
                    if (post && typeof post === 'object') {
                      // Ensure we only extract string properties
                      const title = typeof post.title === 'string' ? post.title : 'Untitled Post';
                      const slug = typeof post.slug === 'string' ? post.slug : '';
                      
                      // Only add posts with valid title and slug
                      if (title && slug) {
                        // Create a clean object with only the properties we need
                        generatedPostsDetails.push({ 
                          title: title, 
                          slug: slug 
                        });
                      }
                    }
                  } catch (postError) {
                    console.error('Error processing post:', postError);
                    // Skip this post on error
                  }
                });
              }
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
        uniqueUrlsCount,
        processedUrlsCount,
        pendingUrlsCount,
        orphanedUrlsCount,
        duplicateUrlsCount,
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
