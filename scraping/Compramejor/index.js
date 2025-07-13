import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

// Define URLs to scrape - can be provided as command line arguments or use defaults
const SEARCH_URLS = ['https://www.compramejor.es/?s=&asl_active=1&p_asid=1&p_asl_data=1&qtranslate_lang=0&asl_gen%5B%5D=exact&asl_gen%5B%5D=title&asl_gen%5B%5D=content&asl_gen%5B%5D=excerpt&customset%5B%5D=post','https://www.compramejor.es/ofertas/','https://www.compramejor.es/','https://www.compramejor.es/t/mejor-valorados/'];

// Ensure output directory exists
// Use absolute path to ensure files are saved in the project directory
// For ES modules, we need to use import.meta.url instead of __dirname
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'generate-mdx/urls/');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Creado directorio: ${OUTPUT_DIR}`);
}

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
          href.startsWith('https://www.compramejor.es/') &&
          !href.includes('?q=') &&
          !href.includes('#')
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

async function scrapeCompramejor() {
  console.log(`🚀 Iniciando scraping de ${SEARCH_URLS.length} URLs...`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
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
    }
    
  } catch (error) {
    console.error(`\n❌ Error general: ${error.message}`);
  } finally {
    await browser.close();
  }
}

scrapeCompramejor();
