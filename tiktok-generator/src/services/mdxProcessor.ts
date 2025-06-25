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
  products: string[];
  image: string;
  excerpt: string;
}

export async function processMarkdown(filePath: string): Promise<ProcessedMarkdown> {
  try {
    // Read MDX file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Extract frontmatter and content using gray-matter
    const { data: metadata, content } = matter(fileContent);
    
    // Extract image URLs/paths from the markdown content
    const images = await extractImages(content, path.dirname(filePath));

       // Leer y parsear el archivo MDX
        const mdxContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(mdxContent);
        
        // Extraer información relevante
        const { title, products, image, excerpt } = data;
    
    return {
      content,
      metadata,
      images,
      title,
      products,
      image,
      excerpt
    };
  } catch (error) {
    console.error('Error processing markdown:', error);
    throw error;
  }
}
