import fs from 'fs';
import path from 'path';

// Load all URLs from files
const urlsDir = './urls';
let allUrls = [];

const files = fs.readdirSync(urlsDir).filter(file => 
  file.endsWith('.json') && 
  !['processed-urls.json', 'pending-urls.json'].includes(file)
);

for (const file of files) {
  const filePath = path.join(urlsDir, file);
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

// Remove duplicates
allUrls = [...new Set(allUrls)];

// Load processed URLs
let processedUrls = [];
try {
  const data = fs.readFileSync('./urls/processed-urls.json', 'utf-8');
  processedUrls = JSON.parse(data);
} catch (error) {
  console.error('Error loading processed URLs:', error);
}

// Keep only processed URLs that still exist in the files
const cleanedProcessedUrls = processedUrls.filter(url => allUrls.includes(url));

console.log('Total URLs in files:', allUrls.length);
console.log('Original processed URLs:', processedUrls.length);
console.log('Cleaned processed URLs:', cleanedProcessedUrls.length);
console.log('URLs available to process:', allUrls.length - cleanedProcessedUrls.length);

// Save cleaned processed URLs
fs.writeFileSync('./urls/processed-urls.json', JSON.stringify(cleanedProcessedUrls, null, 2));
console.log('✅ Cleaned processed-urls.json');

// Show some examples of URLs that will be processed
const urlsToProcess = allUrls.filter(url => !cleanedProcessedUrls.includes(url));
console.log('\n📋 Examples of URLs ready to process:');
urlsToProcess.slice(0, 5).forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

if (urlsToProcess.length > 5) {
  console.log(`... and ${urlsToProcess.length - 5} more`);
}
