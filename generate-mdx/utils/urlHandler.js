import fs from 'fs';
import { URL } from 'url';
import { PROCESSED_URLS_PATH, EXCLUDED_DOMAINS } from '../services/paths.js';

async function loadUrlsFromFiles(urlsDir) {
  let allUrls = [];
  
  try {
    const files = fs.readdirSync(urlsDir).filter(file => 
      file.endsWith('.json') && 
      !['processed-urls.json', 'pending-urls.json'].includes(file)
    );
    
    for (const file of files) {
      const filePath = `${urlsDir}/${file}`;
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const urlsInFile = JSON.parse(data);
        if (Array.isArray(urlsInFile)) {
          const validUrls = urlsInFile.filter(url => typeof url === 'string' && url.trim() !== '');
          allUrls = allUrls.concat(validUrls);
        }
      } catch (error) {
        console.error(`Error loading URLs from ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading URLs from files:', error);
  }
  
  return allUrls;
}

function loadProcessedUrls() {
  try {
    if (fs.existsSync(PROCESSED_URLS_PATH)) {
      const data = fs.readFileSync(PROCESSED_URLS_PATH, 'utf-8');
      return JSON.parse(data);
    } else {
      // If the file doesn't exist, create it with an empty array
      fs.writeFileSync(PROCESSED_URLS_PATH, JSON.stringify([], null, 2));
      return [];
    }
  } catch (error) {
    console.error('Error loading processed URLs:', error);
    // If there's an error (e.g., corrupted JSON), start fresh
    fs.writeFileSync(PROCESSED_URLS_PATH, JSON.stringify([], null, 2));
    return [];
  }
}

function saveProcessedUrls(urls) {
  try {
    fs.writeFileSync(PROCESSED_URLS_PATH, JSON.stringify(urls, null, 2));
    console.log(`💾 URLs procesadas guardadas`);
  } catch (error) {
    console.error('Error saving processed URLs:', error);
  }
}

function isExcludedDomain(urlString) {
  try {
    const domain = new URL(urlString).hostname;
    return EXCLUDED_DOMAINS.includes(domain);
  } catch (error) {
    console.error(`Error parsing URL ${urlString}:`, error);
    return true; // Exclude invalid URLs
  }
}

function calculateUrlStats(allUrls, processedUrls) {
  const uniqueUrls = [...new Set(allUrls)];
  const orphanedUrls = processedUrls.filter(url => !allUrls.includes(url));
  const pendingUrls = uniqueUrls.filter(url => !processedUrls.includes(url));
  
  return {
    total: allUrls.length,
    unique: uniqueUrls.length,
    processed: processedUrls.length,
    pending: pendingUrls.length,
    orphaned: orphanedUrls.length,
    pendingList: pendingUrls
  };
}

export {
  loadUrlsFromFiles,
  loadProcessedUrls,
  saveProcessedUrls,
  isExcludedDomain,
  calculateUrlStats
};
