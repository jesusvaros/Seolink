import fs from 'fs-extra';
import path from 'path';

/**
 * Extract image paths from markdown content
 * Handles both markdown image syntax ![alt](path) and HTML img tags
 */
export async function extract(content: string, basePath: string): Promise<string[]> {
  const images: string[] = [];
  
  // Extract markdown image syntax ![alt](path)
  const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  
  while ((match = markdownImageRegex.exec(content)) !== null) {
    const imagePath = match[1];
    if (imagePath) {
      // Check if it's a URL or a local path
      if (isUrl(imagePath)) {
        images.push(imagePath);
      } else {
        // Convert relative path to absolute
        const absolutePath = path.resolve(basePath, imagePath);
        // Check if file exists
        if (await fs.pathExists(absolutePath)) {
          images.push(absolutePath);
        }
      }
    }
  }
  
  // Extract HTML img tags <img src="path" />
  const htmlImageRegex = /<img.*?src=["'](.*?)["'].*?>/g;
  
  while ((match = htmlImageRegex.exec(content)) !== null) {
    const imagePath = match[1];
    if (imagePath) {
      // Check if it's a URL or a local path
      if (isUrl(imagePath)) {
        images.push(imagePath);
      } else {
        // Convert relative path to absolute
        const absolutePath = path.resolve(basePath, imagePath);
        // Check if file exists
        if (await fs.pathExists(absolutePath)) {
          images.push(absolutePath);
        }
      }
    }
  }
  
  return images;
}

// Helper function to check if a string is a URL
function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
