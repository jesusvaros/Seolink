import fs from 'fs';
import path from 'path';
import { CATEGORIES_PATH } from '../config/paths.js';

/**
 * Generate a unique destacado value for a product
 * @param {Object} product - The product object
 * @returns {string} - A unique destacado value
 */
function generateDestacadoValue(product) {
  // Check if we have pros to use
  if (product.pros && Array.isArray(product.pros) && product.pros.length > 0) {
    return product.pros[0];
  }
  
  // Check if we have specifications to use
  if (product.specifications) {
    const specs = Object.entries(product.specifications);
    if (specs.length > 0) {
      const [key, value] = specs[0];
      return `${value} ${key}`;
    }
  }
  
  // Check if the name contains useful information
  if (product.name) {
    const nameParts = product.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[1]} destacado`;
    }
  }
  
  // Check if we have a description to use
  if (product.description) {
    const words = product.description.split(' ');
    if (words.length > 2) {
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
 * Validate and correct MDX structure
 * @param {string} mdxContent - The MDX content to validate
 * @returns {string} - Validated MDX content
 */
function validateMDXStructure(mdxContent) {
  // TODO: Implement actual validation logic if needed
  console.log('🔧 Validando estructura MDX...');
  return mdxContent;
}

/**
 * Extract metadata from MDX content
 * @param {string} mdxContent - The MDX content
 * @returns {Object} - Extracted metadata
 */
function extractMetadataFromMDX(mdxContent) {
  console.log('ℹ️ Extrayendo metadatos del MDX...');
  try {
    const match = mdxContent.match(/^---json\\n([\\s\\S]*?)\\n---/m);
    if (!match || !match[1]) {
      console.error('❌ No se pudo encontrar el bloque JSON de frontmatter en el MDX.');
      return { 
        slug: 'error-no-frontmatter', 
        category: 'general', 
        title: 'Error: Sin Frontmatter', 
        date: new Date().toISOString().split('T')[0] 
      };
    }
    
    const frontmatterString = match[1];
    const frontmatter = JSON.parse(frontmatterString);
    console.log('✅ Metadatos extraídos correctamente.');
    
    return {
      slug: frontmatter.slug || 'default-slug',
      category: frontmatter.category || 'general',
      title: frontmatter.title || 'Sin Título',
      date: frontmatter.date || new Date().toISOString().split('T')[0],
      image: frontmatter.image || '/default-placeholder.jpg',
    };
  } catch (error) {
    console.error('❌ Error al parsear JSON del frontmatter:', error.message);
    // Return default/error values to prevent crashing
    return { 
      slug: 'error-parsing-frontmatter', 
      category: 'general', 
      title: 'Error: Parseo Frontmatter', 
      date: new Date().toISOString().split('T')[0] 
    };
  }
}

/**
 * Update categories.json with article metadata
 * @param {Object} articleMetadata - Metadata from the article
 */
async function updateCategoriesJson(articleMetadata) {
  console.log(`🔄 Actualizando categorías con metadatos del artículo...`);
  let categoriesData = {};

  try {
    if (fs.existsSync(CATEGORIES_PATH)) {
      const fileContent = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
      if (fileContent.trim() === '') {
        console.warn(`⚠️ ${CATEGORIES_PATH} está vacío. Se inicializará.`);
        categoriesData = {}; // Initialize if empty
      } else {
        categoriesData = JSON.parse(fileContent);
      }
    } else {
      console.log(`ℹ️ ${CATEGORIES_PATH} no encontrado. Se creará uno nuevo.`);
      // Ensure directory exists
      const categoriesDir = path.dirname(CATEGORIES_PATH);
      if (!fs.existsSync(categoriesDir)) {
        fs.mkdirSync(categoriesDir, { recursive: true });
      }
    }

    // Get the category from the article metadata
    const category = articleMetadata.category || 'general';
    
    // Initialize the category if it doesn't exist
    if (!categoriesData[category]) {
      categoriesData[category] = {
        name: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
        description: `Artículos sobre ${category}`,
        articles: []
      };
    }
    
    // Check if the article already exists in the category
    const existingArticleIndex = categoriesData[category].articles.findIndex(
      article => article.slug === articleMetadata.slug
    );
    
    // Create the article entry
    const articleEntry = {
      slug: articleMetadata.slug,
      title: articleMetadata.title,
      date: articleMetadata.date,
      image: articleMetadata.image || '/default-placeholder.jpg'
    };
    
    // Update or add the article
    if (existingArticleIndex !== -1) {
      categoriesData[category].articles[existingArticleIndex] = articleEntry;
    } else {
      categoriesData[category].articles.push(articleEntry);
    }
    
    // Sort articles by date (newest first)
    categoriesData[category].articles.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // Write the updated categories data to the file
    fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categoriesData, null, 2));
    console.log(`✅ ${CATEGORIES_PATH} actualizado correctamente.`);
    
  } catch (error) {
    console.error(`❌ Error al actualizar ${CATEGORIES_PATH}:`, error.message);
  }
}

export {
  generateDestacadoValue,
  validateMDXStructure,
  extractMetadataFromMDX,
  updateCategoriesJson
};
