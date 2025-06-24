import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execPromise = promisify(exec);

export async function createVideoWithRemotion(title, products, audioPath, outputPath, featuredImage = null) {
  try {
    // Verificar que el archivo de audio existe
    if (!existsSync(audioPath)) {
      throw new Error(`No se encontró el archivo de audio en ${audioPath}`);
    }
    
    // Asegurarse de que el directorio de salida existe
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log('Iniciando renderizado con Remotion...');
    
    // Crear un archivo temporal con los datos del video
    const tempDataPath = path.join(outputDir, 'video-data.json');
    await fs.writeFile(tempDataPath, JSON.stringify({
      title,
      products,
      audioPath,
      imageUrl: featuredImage
    }, null, 2));
    
    // Construir el comando para renderizar el video con Remotion
    const remotionPath = path.join(process.cwd(), 'video-generator', 'remotion', 'Video.jsx');
    const command = `npx remotion render ${remotionPath} TikTokVideo ${outputPath} --props="file://${tempDataPath}" --overwrite`;
    
    console.log(`Ejecutando: ${command}`);
    
    // Ejecutar el comando de Remotion
    const { stdout, stderr } = await execPromise(command);
    
    console.log('Salida de Remotion:');
    console.log(stdout);
    
    if (stderr) {
      console.warn('Advertencias de Remotion:');
      console.warn(stderr);
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
