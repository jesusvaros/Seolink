import axios from 'axios';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Descarga una imagen desde una URL y la guarda en el sistema de archivos
 * @param {string} imageUrl - URL de la imagen a descargar
 * @param {string} outputPath - Ruta donde guardar la imagen
 * @returns {Promise<string>} - Ruta donde se guardó la imagen
 */
export async function downloadImage(imageUrl, outputPath) {
  try {
    // Asegurarse de que el directorio exista
    const dir = path.dirname(outputPath);
    await mkdirAsync(dir, { recursive: true });
    
    // Descargar la imagen
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer'
    });
    
    // Guardar la imagen
    await writeFileAsync(outputPath, response.data);
    
    return outputPath;
  } catch (error) {
    console.error(`Error al descargar la imagen desde ${imageUrl}:`, error.message);
    throw error;
  }
}
