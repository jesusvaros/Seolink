import path from 'path';
import { URL } from 'url';
import fs from 'fs';

// Get the current script directory
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const ROOT_DIR = process.cwd();

// Path constants
const URLS_DIR = path.join(SCRIPT_DIR, '..', 'urls');
const PROCESSED_URLS_PATH = path.join(URLS_DIR, 'processed-urls.json');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const OUTPUT_DIR = path.join(CONTENT_DIR, 'posts');
const CATEGORIES_DIR = path.join(CONTENT_DIR, 'categories');
const CATEGORIES_PATH = path.join(CATEGORIES_DIR, 'categories.json');

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
  SCRIPT_DIR,
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
