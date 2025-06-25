import { exec } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import axios from 'axios';

const execPromise = promisify(exec);

// Ruta para guardar los datos temporales
const tempDataDir = path.join(process.cwd(), 'output');

export async function createVideoWithRemotion(title, products, audioPath, outputPath, featuredImage = null) {
  let serverProcess = null;
  
  try {
    // Verificar que el archivo de audio exista
    if (!existsSync(audioPath)) {
      throw new Error(`No se encontró el archivo de audio en ${audioPath}`);
    }
    
    // Crear el directorio de salida si no existe
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Preparar los datos para el video
    const videoData = {
      title,
      products,
      audioPath,
      imageUrl: featuredImage
    };
    
    // Guardar los datos en un archivo temporal específico para este video
    const tempDataPath = path.join(outputDir, 'video-data.json');
    await fs.writeFile(tempDataPath, JSON.stringify(videoData, null, 2));
    
    console.log('Iniciando servidor Remotion...');
    
    // Iniciar el servidor Remotion en segundo plano
    const serverPath = path.join(process.cwd(), 'remotion', 'server.js');
    serverProcess = exec(`node ${serverPath}`);
    
    // Dar tiempo para que el servidor inicie
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Servidor Remotion iniciado. Solicitando renderizado...');
    
    // Hacer una solicitud al servidor para renderizar el video
    const response = await axios.get('http://localhost:3000/render', {
      params: {
        propsFile: tempDataPath,
        outputPath
      },
      timeout: 300000 // 5 minutos de timeout
    });
    
    console.log('Respuesta del servidor:', response.data);
    
    // Verificar que el video se haya generado correctamente
    if (!existsSync(outputPath)) {
      throw new Error(`El video no se generó correctamente en ${outputPath}`);
    }
    
    // Limpiar archivos temporales
    try {
      await fs.unlink(tempDataPath);
    } catch (e) {
      console.warn(`No se pudo eliminar el archivo temporal ${tempDataPath}: ${e.message}`);
    }
    
    // Verificar que el video se haya creado correctamente
    if (!existsSync(outputPath)) {
      throw new Error(`El video no se generó correctamente en ${outputPath}`);
    }
    
    console.log(`Video creado exitosamente: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error en la creación del video con Remotion:', error);
    throw new Error(`Error en la creación del video: ${error.message}`);
  }
}

/**
 * Función de compatibilidad para mantener la interfaz anterior
 */
export async function createVideo(title, products, audioPath, outputPath, featuredImage = null) {
  return createVideoWithRemotion(title, products, audioPath, outputPath, featuredImage);
}
