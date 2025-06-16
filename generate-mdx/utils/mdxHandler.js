import fs from 'fs';
import path from 'path';
import { CATEGORIES_PATH } from '../services/paths.js';



function extractMetadataFromMDX(mdxContent) {
  console.log('ℹ️ Extrayendo metadatos del MDX...');
  try {
    // Updated regex to handle frontmatter that starts with ---json or other variants
    const match = mdxContent.match(/^---(?:json)?\n([\s\S]*?)\n---/m);
    if (!match || !match[1]) {
      console.error('❌ No se pudo encontrar el bloque de frontmatter en el MDX.');
      return { 
        slug: 'error-no-frontmatter', 
        category: 'general', 
        title: 'Error: Sin Frontmatter', 
        date: new Date().toISOString().split('T')[0] 
      };
    }
    
    const frontmatterString = match[1];
    // Parse frontmatter (could be YAML or JSON)
    let frontmatter = {};
    
    // Check if it's JSON format
    if (frontmatterString.trim().startsWith('{')) {
      try {
        frontmatter = JSON.parse(frontmatterString);
        console.log('✅ Frontmatter extraído correctamente.');
        return frontmatter; // Return parsed JSON directly
      } catch (e) {
        console.error('❌ Error parsing JSON frontmatter:', e);
        // Fall back to regex parsing if JSON parsing fails
      }
    }
    
    // Extract title
    const titleMatch = frontmatterString.match(/title:\s*"([^"]*)"/i);
    if (titleMatch && titleMatch[1]) frontmatter.title = titleMatch[1];
    
    // Extract slug
    const slugMatch = frontmatterString.match(/slug:\s*"([^"]*)"/i);
    if (slugMatch && slugMatch[1]) frontmatter.slug = slugMatch[1];
    
    // Extract date
    const dateMatch = frontmatterString.match(/date:\s*"([^"]*)"/i);
    if (dateMatch && dateMatch[1]) frontmatter.date = dateMatch[1];
    
    // Extract category
    const categoryMatch = frontmatterString.match(/category:\s*"([^"]*)"/i);
    if (categoryMatch && categoryMatch[1]) frontmatter.category = categoryMatch[1];
    
    // Extract image
    const imageMatch = frontmatterString.match(/image:\s*"([^"]*)"/i);
    if (imageMatch && imageMatch[1]) frontmatter.image = imageMatch[1];
    
    // Extract excerpt
    const excerptMatch = frontmatterString.match(/excerpt:\s*"([^"]*)"/i);
    if (excerptMatch && excerptMatch[1]) frontmatter.excerpt = excerptMatch[1];
    
    // Extract products (this is still in JSON format)
    const productsMatch = frontmatterString.match(/products:\s*(\[\s*\{[\s\S]*?\}\s*\])/i);
    if (productsMatch && productsMatch[1]) {
      try {
        frontmatter.products = JSON.parse(productsMatch[1]);
      } catch (e) {
        console.error('❌ Error al parsear productos:', e.message);
        frontmatter.products = [];
      }
    }
    
    console.log('✅ Metadatos extraídos correctamente.');
    
    return {
      slug: frontmatter.slug,
      category: frontmatter.category,
      title: frontmatter.title,
      date: frontmatter.date,
      image: frontmatter.image,
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
    
    // Normalize category to lowercase for consistent keys
    const category = articleMetadata.category.toLowerCase();

    console.log('category', category, articleMetadata);
    
    // Create the article entry
    const articleEntry = {
      slug: articleMetadata.slug,
      title: articleMetadata.title,
      date: articleMetadata.date,
      image: articleMetadata.image || '/default-placeholder.jpg'
    };
    
    // Handle different category formats (array or object with articles property)
    if (!categoriesData[category]) {
      // Category doesn't exist, create it as an array (current format)
      categoriesData[category] = [];
    }
    
    // Check if the category is an array or an object with articles
    if (Array.isArray(categoriesData[category])) {
      // It's an array format, add directly
      categoriesData[category].push(articleEntry);
      
      // Sort articles by date (newest first)
      categoriesData[category].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
    } else {
      // It's an object format with articles property
      if (!categoriesData[category].articles) {
        categoriesData[category].articles = [];
      }
      
      categoriesData[category].articles.push(articleEntry);
      
      // Sort articles by date (newest first)
      categoriesData[category].articles.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
    }
    
    // Write the updated categories data to the file
    fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categoriesData, null, 2));
    console.log(`✅ ${CATEGORIES_PATH} actualizado correctamente.`);
    
  } catch (error) {
    console.error(`❌ Error al actualizar ${CATEGORIES_PATH}:`, error.message);
  }
}

export {
  extractMetadataFromMDX,
  updateCategoriesJson
};
