import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import content extraction service
import { fetchCleanContent } from './services/contentExtractor.js';

// Import OpenAI service with fixed product structure
import { generateMDX } from './services/generatemdx.js';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the URL to process
// Using the Elle coffee machine article with confirmed Amazon links
const url = 'https://www.elle.com/es/gourmet/gastronomia/g43215985/mejores-cafeteras-capsulas/';

// Define the output directory for MDX files
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'posts');

// Ensure the content directory exists
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

/**
 * Process the coffee machine article and generate MDX
 */
async function processCoffeeMachines() {
  console.log('🚀 Iniciando procesamiento del artículo de cafeteras...');
  console.log(`🔗 URL: ${url}`);
  
  try {
    // Extract content from the URL
    console.log('🔍 Extrayendo contenido con fetchCleanContent...');
    const extractedData = await fetchCleanContent(url);
    
    if (!extractedData) {
      console.error('❌ Error: No se pudo extraer el contenido de la URL');
      return;
    }
    
    console.log('✅ Contenido extraído correctamente');
    console.log(`📝 Título: ${extractedData.title}`);
    console.log(`📄 Longitud del contenido: ${extractedData.content ? extractedData.content.length : 0} caracteres`);
    console.log(`🔗 Enlaces de productos encontrados: ${extractedData.productLinks ? extractedData.productLinks.length : 0}`);
    console.log(`🔗 precios: ${extractedData.productPrices}`);
    
    // Generate MDX content
    console.log('🤖 Llamando a generateMDX...');
    const mdxContent = await generateMDX(extractedData);
    
    if (!mdxContent) {
      console.error('❌ Error: No se pudo generar el contenido MDX');
      return;
    }
    
    // Create a slug from the title
    const slug = extractedData.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Save the MDX file
    const mdxFilePath = path.join(CONTENT_DIR, `${slug}.mdx`);
    fs.writeFileSync(mdxFilePath, mdxContent, 'utf8');
    
    console.log(`✅ Archivo MDX guardado en: ${mdxFilePath}`);
  } catch (error) {
    console.error('❌ Error durante el procesamiento:', error);
  }
}

// Execute the process
processCoffeeMachines();