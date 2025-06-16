import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

// Define URLs to scrape - can be provided as command line arguments or use defaults
const SEARCH_URLS = process.argv.length > 2 
  ? process.argv.slice(2) 
  : [
      'https://www.elle.com/es/gourmet/',
      'https://www.elle.com/es/belleza/',
      'https://www.elle.com/es/moda/'
    ];

// Ensure output directory exists
const OUTPUT_DIR = path.join(process.cwd(), '../../generate-mdx/urls/');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Creado directorio: ${OUTPUT_DIR}`);
}

/**
 * Scrape a single URL and extract all relevant links
 * @param {string} url - The URL to scrape
 * @param {import('playwright').Browser} browser - Playwright browser instance
 * @returns {Promise<string[]>} - Array of unique links found
 */
async function scrapeUrl(url, browser) {
  console.log(`🔍 Procesando: ${url}`);
  
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const links = await page.$$eval('a[href]', (elements) =>
      elements
        .map((el) => el.href)
        .filter((href) =>
          href.startsWith('https://www.elle.com/es/') &&
          !href.includes('?q=') &&
          !href.includes('#') &&
          href.length > 40
        )
    );

    const unique = [...new Set(links)];
    console.log(`  📊 Encontrados ${unique.length} enlaces únicos`);
    
    return unique;
  } catch (error) {
    console.error(`  ❌ Error procesando ${url}: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Main function to process all URLs
 */
async function scrapeElle() {
  console.log(`🚀 Iniciando scraping de ${SEARCH_URLS.length} URLs...`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const allResults = {};
    
    // Process each URL
    for (const url of SEARCH_URLS) {
      // Create a sanitized filename for this URL
      const outputFileName = url.replace(/^https?:\/\//, '').replace(/\W+/g, '_') + '.json';
      const outputFile = path.join(OUTPUT_DIR, outputFileName);
      
      // Scrape the URL
      const links = await scrapeUrl(url, browser);
      
      // Save results to individual file
      fs.writeFileSync(outputFile, JSON.stringify(links, null, 2));
      console.log(`  💾 Guardados ${links.length} enlaces en ${outputFileName}`);
      
      // Add to combined results
      allResults[url] = links;
    }
    
    // Save combined results
    const combinedFile = path.join(OUTPUT_DIR, 'elle-combined-links.json');
    fs.writeFileSync(combinedFile, JSON.stringify(allResults, null, 2));
    console.log(`\n✅ Proceso completado. Resultados combinados guardados en elle-combined-links.json`);
    
  } catch (error) {
    console.error(`\n❌ Error general: ${error.message}`);
  } finally {
    await browser.close();
  }
}

scrapeElle();
