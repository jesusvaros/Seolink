import fs from 'fs';
import path from 'path';

// URLs de búsqueda que suelen tener contenido fresco con productos de Amazon
const FRESH_SEARCH_URLS = [
  // Elle.com - búsquedas por fechas y términos actuales
  'https://www.elle.com/es/search/?q=enero+2025',
  'https://www.elle.com/es/search/?q=febrero+2025', 
  'https://www.elle.com/es/search/?q=marzo+2025',
  'https://www.elle.com/es/search/?q=abril+2025',
  'https://www.elle.com/es/search/?q=mayo+2025',
  'https://www.elle.com/es/search/?q=junio+2025',
  'https://www.elle.com/es/search/?q=mejores+productos+2025',
  'https://www.elle.com/es/search/?q=tendencias+2025',
  'https://www.elle.com/es/search/?q=ofertas+amazon',
  'https://www.elle.com/es/search/?q=black+friday+2025',
  'https://www.elle.com/es/search/?q=rebajas+enero+2025',
  
  // Compramejor - páginas que se actualizan frecuentemente
  'https://www.compramejor.es/page/2/?s=&asl_active=1&p_asid=1&p_asl_data=1&qtranslate_lang=0&asl_gen%5B%5D=exact&asl_gen%5B%5D=title&asl_gen%5B%5D=content&asl_gen%5B%5D=excerpt&customset%5B%5D=post',
  'https://www.compramejor.es/page/3/?s=&asl_active=1&p_asid=1&p_asl_data=1&qtranslate_lang=0&asl_gen%5B%5D=exact&asl_gen%5B%5D=title&asl_gen%5B%5D=content&asl_gen%5B%5D=excerpt&customset%5B%5D=post',
  'https://www.compramejor.es/page/4/?s=&asl_active=1&p_asid=1&p_asl_data=1&qtranslate_lang=0&asl_gen%5B%5D=exact&asl_gen%5B%5D=title&asl_gen%5B%5D=content&asl_gen%5B%5D=excerpt&customset%5B%5D=post',
];

// Función para generar nombre de archivo basado en fecha
function generateFileName() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `fresh-urls-${dateStr}.json`;
}

// Función principal
function addFreshUrls() {
  const urlsDir = './urls';
  const fileName = generateFileName();
  const filePath = path.join(urlsDir, fileName);
  
  // Verificar si ya existe el archivo para hoy
  if (fs.existsSync(filePath)) {
    console.log(`📅 Ya existe archivo para hoy: ${fileName}`);
    return;
  }
  
  // Crear archivo con URLs frescas
  fs.writeFileSync(filePath, JSON.stringify(FRESH_SEARCH_URLS, null, 2));
  console.log(`✅ Creado archivo con ${FRESH_SEARCH_URLS.length} URLs frescas: ${fileName}`);
  
  // Mostrar algunas URLs de ejemplo
  console.log('\n📋 URLs añadidas:');
  FRESH_SEARCH_URLS.slice(0, 3).forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
  });
  console.log(`... y ${FRESH_SEARCH_URLS.length - 3} más`);
}

// Ejecutar
addFreshUrls();
