import path from 'path';
import { URL } from 'url';
import fs from 'fs';

// Get the current script directory using import.meta.url (ES modules approach)
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Get the project root directory (two levels up from services directory)
const ROOT_DIR = path.resolve(__dirname, '../..');

// Path constants
const URLS_DIR = path.join(ROOT_DIR, 'generate-mdx', 'urls');
const PROCESSED_URLS_PATH = path.join(URLS_DIR, 'processed-urls.json');
// Content directory is at the project root level
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const OUTPUT_DIR = path.join(CONTENT_DIR, 'posts');
const CATEGORIES_DIR = path.join(CONTENT_DIR, 'categories');
const CATEGORIES_PATH = path.join(CATEGORIES_DIR, 'categories.json');

// Log the paths for debugging
console.log(`📂 Project root: ${ROOT_DIR}`);
console.log(`📂 URLs directory: ${URLS_DIR}`);
console.log(`📂 Content directory: ${CONTENT_DIR}`);

// Configuration constants
const EXCLUDED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  // Add other domains to exclude here
];

// Create necessary directories
function createDirectories() {
  const dirs = [
    { path: URLS_DIR, name: 'URLs' },
    { path: OUTPUT_DIR, name: 'Output' },
    { path: CATEGORIES_DIR, name: 'Categories' }
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir.path)) {
      fs.mkdirSync(dir.path, { recursive: true });
      console.log(`📁 ${dir.name} directory created: ${dir.path}`);
    }
  });
}

// Initialize directories
createDirectories();

export {
  ROOT_DIR,
  URLS_DIR,
  PROCESSED_URLS_PATH,
  CONTENT_DIR,
  OUTPUT_DIR,
  CATEGORIES_DIR,
  CATEGORIES_PATH,
  EXCLUDED_DOMAINS,
  createDirectories
};
