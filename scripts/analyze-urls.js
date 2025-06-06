import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path for the URLs directory inside generate-mdx
const URLS_DIR = path.join(__dirname, '..', 'generate-mdx', 'urls');
const PROCESSED_URLS_PATH = path.join(URLS_DIR, 'processed-urls.json');

/**
 * Analyzes the URLs in the source files and processed-urls.json
 */
async function analyzeUrls() {
  console.log('🔍 Analizando URLs...');
  
  try {
    // Load processed URLs
    let processedUrls = [];
    if (fs.existsSync(PROCESSED_URLS_PATH)) {
      const data = fs.readFileSync(PROCESSED_URLS_PATH, 'utf-8');
      processedUrls = JSON.parse(data);
    }
    console.log(`📊 URLs procesadas: ${processedUrls.length}`);
    
    // Load all URLs from source files
    const sourceUrls = new Set();
    const files = fs.readdirSync(URLS_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'processed-urls.json') {
        const filePath = path.join(URLS_DIR, file);
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          const urlsInFile = JSON.parse(data);
          
          if (Array.isArray(urlsInFile)) {
            urlsInFile.forEach(url => {
              if (typeof url === 'string' && url.trim() !== '') {
                sourceUrls.add(url.trim());
              }
            });
          } else {
            console.warn(`⚠️ Contenido de ${file} no es un array, se omitirá.`);
          }
        } catch (err) {
          console.error(`❌ Error al leer o parsear ${filePath}:`, err.message);
        }
      }
    }
    
    console.log(`📊 URLs únicas en archivos fuente: ${sourceUrls.size}`);
    
    // Find URLs that haven't been processed yet
    const pendingUrls = [...sourceUrls].filter(url => !processedUrls.includes(url));
    console.log(`📊 URLs pendientes de procesar: ${pendingUrls.length}`);
    
    // Show the first 10 pending URLs as examples
    if (pendingUrls.length > 0) {
      console.log('\n📋 Ejemplos de URLs pendientes:');
      pendingUrls.slice(0, 10).forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
    }
    
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
    
    console.log('\n📊 Distribución por dominio:');
    Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        console.log(`${domain}: ${count} URLs`);
      });
      
    // Write pending URLs to a file for easy access
    const pendingUrlsPath = path.join(URLS_DIR, 'pending-urls.json');
    fs.writeFileSync(pendingUrlsPath, JSON.stringify(pendingUrls, null, 2));
    console.log(`\n✅ URLs pendientes guardadas en: ${pendingUrlsPath}`);
    
  } catch (error) {
    console.error(`❌ Error al analizar URLs: ${error.message}`);
  }
}

// Run the analysis
analyzeUrls();
