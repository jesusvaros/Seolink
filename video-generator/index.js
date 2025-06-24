#!/usr/bin/env node

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { generateScript } from './services/scriptGenerator.js';
import { generateAudio } from './services/audioGenerator.js';
import { createVideo } from './services/remotionVideoCreator.js';
import { downloadImage } from './services/imageDownloader.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios de trabajo
const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMP_DIR = path.join(__dirname, 'temp');

// Crear directorios si no existen
async function ensureDirectories() {
  const dirs = [OUTPUT_DIR, TEMP_DIR, path.join(TEMP_DIR, 'images')];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Función principal
async function main() {
  try {
    // Verificar argumentos
    const mdxFile = '/Users/aa/CascadeProjects/amazon-afiliados/content/posts/camisetas-blancas-la-prenda-esencial-para-cada-estilo.mdx';
    

    if (!mdxFile) {
      console.error('Por favor, especifica un archivo MDX: node index.js ruta/al/archivo.mdx');
      process.exit(1);
    }

    // Asegurar que los directorios existan
    await ensureDirectories();

    // Ruta completa al archivo MDX
    const mdxPath = mdxFile.startsWith('/') 
      ? mdxFile 
      : path.resolve(__dirname, mdxFile);
    
    console.log(`Procesando archivo: ${mdxPath}`);
    
    // Leer y parsear el archivo MDX
    const mdxContent = await fs.readFile(mdxPath, 'utf-8');
    const { data } = matter(mdxContent);
    
    // Extraer información relevante
    const { title, products, image, excerpt } = data;
    
    console.log(`Título: ${title}`);
    console.log(`Productos encontrados: ${products.length}`);
    console.log(`Imagen destacada: ${image || 'No disponible'}`);
    
    // Generar un identificador único para este video
    const videoId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Descargar imágenes de productos
    const imagePromises = products.map((product, index) => {
      const imagePath = path.join(TEMP_DIR, 'images',title, `product_${index}.jpg`);
      return downloadImage(product.image, imagePath)
        .then(() => ({
          index,
          name: product.name,
          path: imagePath,
          description: product.analisis || product.review?.reviewBody || ''
        }));
    });
    
    const productImages = await Promise.all(imagePromises);
    console.log('Imágenes descargadas correctamente');
    
    // Generar guión para el video

    const scriptPath = path.join(OUTPUT_DIR, title, `${videoId}.txt`);
    const script = await generateScript(title, excerpt, productImages,scriptPath);

    console.log('Guión generado correctamente',script);
    
    // Generar audio a partir del guión
    const audioOutputDir = path.join(OUTPUT_DIR, videoId);
    await fs.mkdir(audioOutputDir, { recursive: true });
    const audioPath = path.join(audioOutputDir, `audio.mp3`);
    await generateAudio(script, audioPath);
    if (!existsSync(audioPath)) {
      console.log('No se ha generado audio. Deteniendo el proceso.');
      process.exit(1);
    } 
    console.log('Audio generado correctamente');
    
    // Crear video con las imágenes y el audio
    const videoPath = path.join(audioOutputDir, `${videoId}.mp4`);
    await createVideo(title, products, audioPath, videoPath, image);
    console.log(`Video creado correctamente: ${videoPath}`);
    
  } catch (error) {
    console.error('Error al generar el video:', error);
    process.exit(1);
  }
}

main();
