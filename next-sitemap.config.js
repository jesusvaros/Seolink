/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://comparaland.es',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: [
    '/404*', 
    '/500*',
    '/categorias/*/*' // Excluir URLs de artículos con categoría
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://comparaland.es/sitemap-categories.xml'
    ],
    policies: [
      { userAgent: '*', allow: '/' },
    ],
  },
  changefreq: 'weekly',
  priority: 0.7,
  // Personaliza la prioridad por ruta
  transform: async (config, path) => {
    // Da mayor prioridad a las páginas principales
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }
    // Mayor prioridad a artículos de categorías populares (solo URLs canónicas)
    if (path.startsWith('/cocina') || 
        path.startsWith('/belleza')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }
    
    // Prioridad para las páginas de categorías (solo las páginas principales de categoría, no los artículos)
    if (path.startsWith('/categorias/') && path.split('/').length === 3) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.75,
        lastmod: new Date().toISOString(),
      };
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
