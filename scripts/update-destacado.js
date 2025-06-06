import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');

/**
 * Generates a unique destacado value for a product based on its features, pros, or name
 * @param {Object} product - The product object
 * @returns {string} - A unique destacado value
 */
function generateDestacadoValue(product) {
  // Check if we have pros to use
  if (product.pros && Array.isArray(product.pros) && product.pros.length > 0) {
    // Use the first pro as the main feature
    const mainFeature = product.pros[0];
    return mainFeature;
  }
  
  // Check if we have specifications to use
  if (product.specifications) {
    const specs = Object.entries(product.specifications);
    if (specs.length > 0) {
      // Use the first specification as a feature
      const [key, value] = specs[0];
      return `${value} ${key}`;
    }
  }
  
  // Check if the name contains useful information
  if (product.name) {
    const nameParts = product.name.split(' ');
    if (nameParts.length > 1) {
      // Use the second word of the name (often a descriptor)
      return `${nameParts[1]} destacado`;
    }
  }
  
  // Check if we have a description to use
  if (product.description) {
    const words = product.description.split(' ');
    if (words.length > 2) {
      // Use the first 2-3 words of the description
      return `${words.slice(0, 2).join(' ')}`;
    }
  }
  
  // Fallback to a generic but slightly varied message
  const variations = [
    'Calidad superior',
    'Mejor relación calidad-precio',
    'Producto destacado',
    'Opción recomendada',
    'Alta durabilidad'
  ];
  
  // Use a random variation based on the product's ASIN to ensure consistency
  const index = product.asin ? 
    product.asin.charCodeAt(product.asin.length - 1) % variations.length : 
    Math.floor(Math.random() * variations.length);
  
  return variations[index];
}

/**
 * Updates all MDX files in the posts directory with unique destacado values
 */
async function updateDestacadoValues() {
  console.log('🔄 Actualizando valores destacados en archivos MDX...');
  
  try {
    // Get all MDX files in the posts directory
    const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.mdx'));
    console.log(`📊 Encontrados ${files.length} archivos MDX para actualizar`);
    
    let updatedFiles = 0;
    let updatedProducts = 0;
    
    // Process each file
    for (const file of files) {
      const filePath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Find the JSON frontmatter
      const match = content.match(/^---json\n([\s\S]*?)\n---/);
      if (!match) {
        console.log(`⚠️ No se encontró frontmatter JSON en ${file}, omitiendo...`);
        continue;
      }
      
      try {
        // Parse the JSON frontmatter
        const frontmatter = JSON.parse(match[1]);
        let fileUpdated = false;
        
        // Update destacado values for each product
        if (frontmatter.products && Array.isArray(frontmatter.products)) {
          for (const product of frontmatter.products) {
            if (product.destacado === 'Producto recomendado') {
              // Generate a unique destacado value
              product.destacado = generateDestacadoValue(product);
              updatedProducts++;
              fileUpdated = true;
            }
          }
          
          if (fileUpdated) {
            // Update the file with the new frontmatter
            const updatedFrontmatter = JSON.stringify(frontmatter, null, 2);
            const updatedContent = content.replace(/^---json\n[\s\S]*?\n---/, `---json\n${updatedFrontmatter}\n---`);
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            updatedFiles++;
            console.log(`✅ Actualizado ${file} con nuevos valores destacados`);
          } else {
            console.log(`ℹ️ No se requirieron cambios en ${file}`);
          }
        } else {
          console.log(`⚠️ No se encontraron productos en ${file}, omitiendo...`);
        }
      } catch (error) {
        console.error(`❌ Error al procesar ${file}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Proceso completado: ${updatedProducts} productos actualizados en ${updatedFiles} archivos`);
  } catch (error) {
    console.error(`❌ Error al actualizar los valores destacados: ${error.message}`);
  }
}

// Run the update function
updateDestacadoValues();
