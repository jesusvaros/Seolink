const fs = require('fs');
const path = require('path');

// Función para generar el sitemap de categorías
async function generateCategoriesSitemap() {
  try {
    console.log('Generando sitemap de categorías...');
    
    // Leer el archivo de categorías
    const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    
    // Obtener todas las categorías
    const categories = Object.keys(categoriesData);
    
    // Crear el XML del sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    // Añadir URLs de categorías
    categories.forEach(category => {
      sitemap += `
<url>
  <loc>https://comparaland.es/categorias/${category}</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>`;
    });

    // Añadir URLs de artículos (solo URLs canónicas)
    for (const category of categories) {
      const articles = categoriesData[category];
      
      articles.forEach(article => {
        // Añadir solo la URL canónica del artículo
        if (article.slug) {
          sitemap += `
<url>
  <loc>https://comparaland.es/${article.slug}</loc>
  <lastmod>${new Date(article.date).toISOString()}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>`;
        }
        
        // Ya no añadimos la URL con ruta de categoría
        // porque ahora redirige a la URL canónica
      });
    }

    // Cerrar el XML
    sitemap += `
</urlset>`;

    // Guardar el archivo
    const outputPath = path.join(process.cwd(), 'public/sitemap-categories.xml');
    fs.writeFileSync(outputPath, sitemap);
    
    console.log(`Sitemap de categorías generado en: ${outputPath}`);
  } catch (error) {
    console.error('Error al generar el sitemap de categorías:', error);
  }
}

// Ejecutar la función
generateCategoriesSitemap();
