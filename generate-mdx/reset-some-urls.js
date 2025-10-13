import fs from 'fs';

// URLs que queremos volver a procesar (que sabemos que tienen productos)
const urlsToReset = [
  'https://www.elle.com/es/belleza/cara-cuerpo/g38560549/mejores-serum-antiedad/',
  'https://www.elle.com/es/belleza/cara-cuerpo/g38015231/depiladoras-laser-luz-pulsada/',
  'https://www.elle.com/es/belleza/pelo/g38026004/champus-pelo-rizado/',
  'https://www.elle.com/es/gourmet/gastronomia/g43274351/mejores-cafeteras-italianas-analizadas-comparadas/',
  'https://www.elle.com/es/living/ocio-cultura/g45650588/regalos-jubilacion-originales/',
];

// Leer URLs procesadas
const processedUrlsPath = './urls/processed-urls.json';
let processedUrls = [];

try {
  const data = fs.readFileSync(processedUrlsPath, 'utf-8');
  processedUrls = JSON.parse(data);
} catch (error) {
  console.error('Error loading processed URLs:', error);
  process.exit(1);
}

console.log(`📊 URLs procesadas antes: ${processedUrls.length}`);

// Remover las URLs que queremos volver a procesar
const originalLength = processedUrls.length;
processedUrls = processedUrls.filter(url => !urlsToReset.includes(url));

console.log(`📊 URLs procesadas después: ${processedUrls.length}`);
console.log(`🔄 URLs removidas para reprocesar: ${originalLength - processedUrls.length}`);

// Guardar las URLs procesadas actualizadas
fs.writeFileSync(processedUrlsPath, JSON.stringify(processedUrls, null, 2));

console.log('✅ URLs reseteadas para reprocesamiento');

// Mostrar las URLs que se van a procesar
console.log('\n📋 URLs que se procesarán:');
urlsToReset.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});
