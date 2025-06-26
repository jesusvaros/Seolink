import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { compile } from '@mdx-js/mdx';
import { extract as extractImages } from '../utils/imageExtractor.js';

export interface ProcessedMarkdown {
  content: string;
  metadata: Record<string, any>;
  images: string[];
  title: string;
  description?: string; // Added description field
  products: any[];
  image: string;
  excerpt: string;
  slideImages: string[]; // Array of images for the slideshow
}

export async function processMarkdown(filePath: string): Promise<ProcessedMarkdown> {
  try {
    // Read MDX file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Extract frontmatter and content using gray-matter
    const { data: metadata, content } = matter(fileContent);
    
    // Extract image URLs/paths from the markdown content
    const images = await extractImages(content, path.dirname(filePath));

    // Extract information from MDX frontmatter
    const { title, products = [], image, excerpt, description } = metadata;
    
    // Create an array of images for the TikTok video slideshow
    const slideImages: string[] = [];
    
    // 1. Add the main image as the first slide
    if (image) {
      slideImages.push(image);
    }
    
    // 2. Add product images
    if (Array.isArray(products)) {
      for (const product of products) {
        if (product && product.image) {
          slideImages.push(product.image);
        }
      }
    }
    
    // 3. Add logo as the last slide
    const logoUrl = 'https://jesusvaros.com/wp-content/uploads/2024/04/logo.png'; // Using absolute URL
    slideImages.push(logoUrl);
    
    // Make sure we have at least some images
    if (slideImages.length === 0) {
      console.warn('No images found in MDX file, using fallback images');
      slideImages.push(
        'https://via.placeholder.com/1080x1920/333333/ffffff?text=No+Image+Available'
      );
    }

    console.log('Slide images:', slideImages, products);
    
    // Return processed markdown data
    return {
      content,
      metadata,
      images,
      title: title || path.basename(filePath, path.extname(filePath)),
      description: description || excerpt || '', // Include description, fallback to excerpt
      products,
      image: image || '',
      excerpt: excerpt || '',
      slideImages,
    };
  } catch (error) {
    console.error('Error processing markdown:', error);
    throw error;
  }
}
