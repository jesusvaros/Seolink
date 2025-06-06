import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path for the URLs directory inside generate-mdx
const URLS_DIR = path.join(__dirname, '..', 'generate-mdx', 'urls');
const PROCESSED_URLS_PATH = path.join(URLS_DIR, 'processed-urls.json');

/**
 * Analyzes the URLs in the source files and processed-urls.json with detailed statistics
 */
async function analyzeUrlStatistics() {
  console.log('📊 ESTADÍSTICAS DE URLs 📊');
  console.log('========================\n');
  
  try {
    // Load processed URLs
    let processedUrls = [];
    if (fs.existsSync(PROCESSED_URLS_PATH)) {
      const data = fs.readFileSync(PROCESSED_URLS_PATH, 'utf-8');
      processedUrls = JSON.parse(data);
    }
    
    // Load all URLs from source files
    const sourceUrlsMap = new Map(); // Map to track which file each URL comes from
    const sourceUrls = new Set();
    const files = fs.readdirSync(URLS_DIR);
    const sourceFiles = [];
    
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'processed-urls.json' && file !== 'pending-urls.json') {
        sourceFiles.push(file);
        const filePath = path.join(URLS_DIR, file);
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          const urlsInFile = JSON.parse(data);
          
          if (Array.isArray(urlsInFile)) {
            urlsInFile.forEach(url => {
              if (typeof url === 'string' && url.trim() !== '') {
                const trimmedUrl = url.trim();
                sourceUrls.add(trimmedUrl);
                
                // Track which file this URL came from
                if (!sourceUrlsMap.has(trimmedUrl)) {
                  sourceUrlsMap.set(trimmedUrl, []);
                }
                sourceUrlsMap.get(trimmedUrl).push(file);
              }
            });
          }
        } catch (err) {
          console.error(`❌ Error al leer o parsear ${filePath}:`, err.message);
        }
      }
    }
    
    // Find URLs that appear in multiple source files (duplicates)
    const duplicateUrls = [...sourceUrlsMap.entries()]
      .filter(([_, files]) => files.length > 1)
      .map(([url, files]) => ({ url, files }));
    
    // Find URLs that are in processed but not in source
    const orphanedUrls = processedUrls.filter(url => !sourceUrls.has(url));
    
    // Find URLs that are in source but not in processed
    const pendingUrls = [...sourceUrls].filter(url => !processedUrls.includes(url));
    
    // Count URLs by domain
    const domainCounts = {};
    [...sourceUrls].forEach(url => {
      try {
        const domain = new URL(url).hostname;
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      } catch (error) {
        console.warn(`⚠️ URL inválida: ${url}`);
      }
    });
    
    // Print statistics
    console.log(`📁 Archivos fuente: ${sourceFiles.length}`);
    console.log(`🔗 URLs totales en archivos fuente (incluyendo duplicados): ${[...sourceUrlsMap.values()].flat().length}`);
    console.log(`🔄 URLs únicas en archivos fuente: ${sourceUrls.size}`);
    console.log(`✅ URLs procesadas: ${processedUrls.length}`);
    console.log(`⏳ URLs pendientes de procesar: ${pendingUrls.length}`);
    console.log(`🗑️ URLs huérfanas (en processed pero no en source): ${orphanedUrls.length}`);
    console.log(`🔄 URLs duplicadas (aparecen en múltiples archivos): ${duplicateUrls.length}`);
    
    console.log('\n📊 Distribución por dominio:');
    Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        console.log(`  ${domain}: ${count} URLs`);
      });
    
    // Show orphaned URLs if any
    if (orphanedUrls.length > 0) {
      console.log('\n🗑️ URLs huérfanas (primeras 10):');
      orphanedUrls.slice(0, 10).forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
    }
    
    // Show duplicate URLs if any
    if (duplicateUrls.length > 0) {
      console.log('\n🔄 URLs duplicadas (primeras 5):');
      duplicateUrls.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.url}`);
        console.log(`     Aparece en: ${item.files.join(', ')}`);
      });
    }
    
    // Show pending URLs if any
    if (pendingUrls.length > 0) {
      console.log('\n⏳ URLs pendientes (primeras 10):');
      pendingUrls.slice(0, 10).forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Error al analizar URLs: ${error.message}`);
  }
}

// Run the analysis
analyzeUrlStatistics();
