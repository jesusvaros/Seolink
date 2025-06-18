import fs from 'fs';
import path from 'path';

// Import configuration
import {
  URLS_DIR,
  OUTPUT_DIR,
} from './services/paths.js';

// Import OpenAI service with fixed product structure
import { generateMDX } from './services/generatemdx.js';

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
  extractMetadataFromMDX,
  updateCategoriesJson
} from './utils/mdxHandler.js';

// Import content extraction services
import {
  containsAmazonLinks,
  fetchCleanContent
} from './services/contentExtractor.js';

async function processUrl(url) {
  let didAttemptFullProcessing = false;

  try {
    const cleanUrl = url.trim().replace(/['"`]+$/, '');
    const hasAmazonLinks = await containsAmazonLinks(cleanUrl);

    if (!hasAmazonLinks) {
      console.log('⏩ Saltando URL - No contiene enlaces de Amazon');
      return { success: true, skipped: true, reason: 'no-amazon-links' };
    }

    console.log('✅ La URL contiene enlaces de Amazon');

    // Extract clean content from URL
    console.log('📄 Extrayendo contenido limpio...');
    const data = await fetchCleanContent(url);
    didAttemptFullProcessing = true;

    if (!data || !data.title || !data.content || !data.productPrices || data.productPrices.length === 0) {
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

    // Extract metadata for filename and categories update
    const metadata = extractMetadataFromMDX(mdxContent);
    
    // Validate metadata before proceeding
    if (!metadata || !metadata.slug || metadata.slug === 'undefined') {
      console.log('⏩ Saltando URL - Metadatos inválidos o incompletos');
      return { success: true, skipped: true, reason: 'invalid-metadata' };
    }

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
  const scrapedResults = []; 

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
}

// Execute the script only if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error global:', error);
    process.exit(1);
  });
}
