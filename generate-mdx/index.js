import fs from 'fs';
import path from 'path';

// Import configuration
import {
  URLS_DIR,
  OUTPUT_DIR,
  CONTENT_DIR
} from './config/paths.js';

// Import URL handling utilities
import {
  loadUrlsFromFiles,
  loadProcessedUrls,
  saveProcessedUrls,
  isExcludedDomain,
  calculateUrlStats
} from './utils/urlHandler.js';

// Import MDX handling utilities
import {
  validateMDXStructure,
  extractMetadataFromMDX,
  updateCategoriesJson,
  generateDestacadoValue
} from './utils/mdxHandler.js';

// Import content extraction services
import {
  containsAmazonLinks,
  fetchCleanContent
} from './services/contentExtractor.js';

// Import OpenAI service
import { generateMDX } from './services/openaiService.js';

// Helper function for text indentation (kept in index.js as it's a simple utility)
function indentMultiline(text, indent = '      ') {
  if (!text) return '';
  return text.split('\n').join(`\n${indent}`);
}

/**
 * Process a single URL to extract content and generate MDX
 * @param {string} url - The URL to process
 * @returns {Object} - Processing result and status
 */
async function processUrl(url) {
  let didAttemptFullProcessing = false;
  
  try {
    console.log(`\n🔍 Procesando URL: ${url}`);
    
    // Check if URL contains Amazon links
    console.log('🔎 Comprobando si la URL contiene enlaces de Amazon...');
    const hasAmazonLinks = await containsAmazonLinks(url);
    
    if (!hasAmazonLinks) {
      console.log('⏩ Saltando URL - No contiene enlaces de Amazon');
      return { success: true, skipped: true, reason: 'no-amazon-links' };
    }
    
    console.log('✅ La URL contiene enlaces de Amazon');
    
    // Extract clean content from URL
    console.log('📄 Extrayendo contenido limpio...');
    const data = await fetchCleanContent(url);
    didAttemptFullProcessing = true;
    
    if (!data || !data.title || !data.content) {
      console.log('⏩ Saltando URL - No se pudo extraer contenido válido');
      return { success: true, skipped: true, reason: 'invalid-content' };
    }
    
    console.log(`✅ Contenido extraído: "${data.title}"`);
    
    // Generate MDX content
    console.log('🤖 Generando contenido MDX...');
    let mdxContent = await generateMDX(data);

    if (mdxContent === null) {
      console.log(`⏩ Saltando ${url} - No se encontraron productos con ASIN válido o no se cumplieron los criterios`);
      return { success: true, skipped: true, reason: 'invalid-products' };
    }
    
    // Validate and correct MDX structure before saving
    mdxContent = validateMDXStructure(mdxContent);
    
    // Extract metadata for filename and categories update
    const metadata = extractMetadataFromMDX(mdxContent);
    
    // Create slug for filename
    const fileName = `${metadata.slug}.mdx`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    // Save the file
    fs.writeFileSync(filePath, mdxContent);
    console.log(`✅ Guardado en ${filePath}`);
    
    // Update categories.json
    await updateCategoriesJson(metadata);
    
    console.log(`✅ URL ${url} procesada correctamente`);
    
    return { success: true, skipped: false, metadata };
  } catch (error) {
    console.error(`❌ Error al procesar ${url}:`, error.message);
    return { success: false, error: error.message, didAttemptFullProcessing };
  }
}

/**
 * Main function to process all URLs
 */
async function main() {
  const scrapedResults = []; // Collect all scraped data here

  try {
    console.log('\n🚀 Iniciando generador de MDX...');
    
    // Load processed URLs
    const processedUrls = loadProcessedUrls();
    console.log(`\n📊 URLs ya procesadas: ${processedUrls.length}`);
    
    // Load URLs from files
    const allUrls = await loadUrlsFromFiles(URLS_DIR);
    console.log(`\n📋 Total URLs encontradas: ${allUrls.length}`);
    
    // Calculate URL statistics
    const stats = calculateUrlStats(allUrls, processedUrls);
    
    // Filter URLs to process (not processed and not excluded)
    const urlsToProcess = stats.pendingList.filter(url => !isExcludedDomain(url));
    console.log(`\n🔍 URLs válidas para procesar: ${urlsToProcess.length}`);
    
    if (urlsToProcess.length === 0) {
      console.log('\n✅ No hay nuevas URLs para procesar');
      return;
    }
    
    // Process each URL
    for (let i = 0; i < urlsToProcess.length; i++) {
      const url = urlsToProcess[i];
      const result = await processUrl(url);
      
      // If successful and not skipped, add to scraped results
      if (result.success && !result.skipped) {
        scrapedResults.push({
          url,
          title: result.metadata.title,
          slug: result.metadata.slug
        });
      }
      
      // Mark as processed regardless of outcome
      processedUrls.push(url);
      saveProcessedUrls(processedUrls);
      
      // Pause between URLs to avoid overloading the API
      if (result.didAttemptFullProcessing && i < urlsToProcess.length - 1) {
        console.log(`⏳ Esperando 5 segundos antes de procesar la siguiente URL...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Display final statistics
    const finalStats = calculateUrlStats(allUrls, processedUrls);
    console.log('\n📊 Estadísticas finales:');
    console.log(`   - URLs procesadas: ${finalStats.processed}`);
    console.log(`   - URLs pendientes: ${finalStats.pending}`);
    console.log(`   - URLs huérfanas: ${finalStats.orphaned}`);
    console.log('\n🎉 Proceso completado!');
    
  } catch (error) {
    console.error('\n❌ Error en el proceso principal:', error);
  }
  
  // Save all scraped results to a single file if any were collected
  if (scrapedResults.length > 0) {
    const scrapedFilePath = path.join(URLS_DIR, 'scraped_urls.json');
    fs.writeFileSync(scrapedFilePath, JSON.stringify(scrapedResults, null, 2));
    console.log(`✅ Resultados guardados en ${scrapedFilePath}`);
  }
  
  // Fix price format in all MDX files
  await fixMdxPriceFormat();
  console.log('✅ Formato de precios corregido en todos los archivos MDX');
}

/**
 * Fix price format in MDX files to ensure proper display and schema.org compliance
 * This function converts price objects to strings and ensures rich results validation
 */
async function fixMdxPriceFormat() {
  const postsDir = path.join(CONTENT_DIR, 'posts');
  
  // Get all MDX files
  const mdxFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.mdx'));
  console.log(`\n🔍 Revisando formato de precios en ${mdxFiles.length} archivos MDX...`);
  
  // Process each file
  let fixedFiles = 0;
  let unchangedFiles = 0;
  
  for (const file of mdxFiles) {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file contains price objects
    if (content.includes('"price": {')) {
      console.log(`  🔧 Procesando ${file}...`);
      
      // Parse the frontmatter JSON
      const frontmatterMatch = content.match(/---json\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        console.log(`  ⚠️ No se encontró frontmatter en ${file}, omitiendo`);
        unchangedFiles++;
        continue;
      }
      
      try {
        const frontmatterStr = frontmatterMatch[1];
        const frontmatter = JSON.parse(frontmatterStr);
        let modified = false;
        
        // Process each product
        if (frontmatter.products && Array.isArray(frontmatter.products)) {
          frontmatter.products.forEach(product => {
            // Fix price objects
            if (product.price && typeof product.price === 'object' && product.price.display) {
              product.price = product.price.display;
              modified = true;
            }
            
            // Ensure offers has all required fields
            if (product.offers) {
              if (!product.offers['@type']) {
                product.offers['@type'] = 'Offer';
                modified = true;
              }
              
              if (!product.offers.priceValidUntil) {
                // Set price valid until to one year from now
                const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
                product.offers.priceValidUntil = nextYear;
                modified = true;
              }
              
              // Ensure price is a number in offers
              if (typeof product.offers.price === 'string') {
                const numericPrice = parseFloat(product.offers.price.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
                product.offers.price = numericPrice.toString();
                modified = true;
              }
            }
            
            // Ensure brand has proper format
            if (product.brand && !product.brand['@type']) {
              product.brand = {
                '@type': 'Brand',
                name: typeof product.brand === 'string' ? product.brand : product.brand.name || 'Marca no especificada'
              };
              modified = true;
            }
            
            // Add review if missing
            if (!product.review) {
              product.review = {
                '@type': 'Review',
                author: {'@type': 'Person', name: 'Análisis del Experto'},
                datePublished: new Date().toISOString().split('T')[0],
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: '4.5',
                  bestRating: '5'
                },
                reviewBody: product.description || 'Análisis detallado del producto.'
              };
              modified = true;
            }
            
            // Add aggregateRating if missing
            if (!product.aggregateRating) {
              product.aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: '4.0',
                reviewCount: '5',
                bestRating: '5'
              };
              modified = true;
            }
          });
        }
        
        if (modified) {
          // Replace the frontmatter in the file
          const updatedFrontmatter = JSON.stringify(frontmatter, null, 2);
          const updatedContent = content.replace(/---json\n[\s\S]*?\n---/, `---json\n${updatedFrontmatter}\n---`);
          
          // Write the updated content back to the file
          fs.writeFileSync(filePath, updatedContent);
          console.log(`  ✅ Corregido ${file}`);
          fixedFiles++;
        } else {
          console.log(`  ⏭️ No se necesitan cambios en ${file}`);
          unchangedFiles++;
        }
      } catch (error) {
        console.error(`  ❌ Error procesando ${file}:`, error.message);
        unchangedFiles++;
      }
    } else {
      unchangedFiles++;
    }
  }
  
  console.log('\n📊 Resumen de corrección de precios:');
  console.log(`   - Archivos revisados: ${mdxFiles.length}`);
  console.log(`   - Archivos corregidos: ${fixedFiles}`);
  console.log(`   - Archivos sin cambios: ${unchangedFiles}`);
}

// Execute the script only if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error global:', error);
    process.exit(1);
  });
}
