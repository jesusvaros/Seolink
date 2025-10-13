import fs from 'fs';
import path from 'path';

// URLs específicas que suelen tener productos de Amazon
const FRESH_SEARCH_URLS = [
  // Elle.com - artículos específicos con productos
  'https://www.elle.com/es/belleza/cara-cuerpo/g38560549/mejores-serum-antiedad/',
  'https://www.elle.com/es/belleza/cara-cuerpo/g38015231/depiladoras-laser-luz-pulsada/',
  'https://www.elle.com/es/belleza/pelo/g38026004/champus-pelo-rizado/',
  'https://www.elle.com/es/gourmet/gastronomia/g43274351/mejores-cafeteras-italianas-analizadas-comparadas/',
  'https://www.elle.com/es/living/ocio-cultura/g45650588/regalos-jubilacion-originales/',
  'https://www.elle.com/es/belleza/cara-cuerpo/g23721229/calendarios-adviento-navidad/',
  'https://www.elle.com/es/gourmet/recetas-cocina/g61895660/recetas-faciles-cocinar-verduras/',
  
  // Compramejor - artículos específicos de productos
  'https://www.compramejor.es/mejores-aspiradoras-robot-2025/',
  'https://www.compramejor.es/mejores-cafeteras-automaticas-2025/',
  'https://www.compramejor.es/mejores-freidoras-aire-2025/',
  'https://www.compramejor.es/mejores-batidoras-amasadoras-2025/',
  'https://www.compramejor.es/mejores-robots-cocina-2025/',
  'https://www.compramejor.es/mejores-secadores-pelo-2025/',
  'https://www.compramejor.es/mejores-planchas-pelo-2025/',
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
