import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface Article {
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
}

interface Product {
  name?: string;
  title?: string;
  brand?: string;
}

interface SearchResult extends Article {
  category: string;
  productNames?: string[];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(400).json({ message: 'Query parameter "q" is required and must be at least 2 characters' });
  }

  try {
    // Leer datos de categorías
    const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
    const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
    const categoriesObj = JSON.parse(categoriesData);
    
    // Recopilar todos los artículos con su categoría y productos
    const allArticles: SearchResult[] = [];
    const postsDir = path.join(process.cwd(), 'content/posts');
    
    Object.keys(categoriesObj).forEach(category => {
      if (Array.isArray(categoriesObj[category])) {
        categoriesObj[category].forEach((article: Article) => {
          // Leer el archivo MDX para extraer productos
          let productNames: string[] = [];
          try {
            const filePath = path.join(postsDir, `${article.slug}.mdx`);
            if (fs.existsSync(filePath)) {
              const fileContent = fs.readFileSync(filePath, 'utf8');
              const { data } = matter(fileContent);
              
              // Extraer nombres de productos
              if (data.products && Array.isArray(data.products)) {
                productNames = data.products.map((product: Product) => 
                  product.name || product.title || ''
                ).filter(Boolean);
              }
            }
          } catch (error) {
            // Si hay error leyendo el archivo, continuar sin productos
          }
          
          allArticles.push({
            ...article,
            category: getCategoryDisplayName(category),
            productNames
          });
        });
      }
    });
    
    // Buscar artículos que coincidan con la query
    const query = q.toLowerCase().trim();
    const results = allArticles.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(query);
      const excerptMatch = article.excerpt?.toLowerCase().includes(query) || false;
      const categoryMatch = article.category.toLowerCase().includes(query);
      
      // Buscar en nombres de productos
      const productMatch = article.productNames?.some(productName => 
        productName.toLowerCase().includes(query)
      ) || false;
      
      return titleMatch || excerptMatch || categoryMatch || productMatch;
    });
    
    // Ordenar resultados por relevancia (título primero, productos, luego excerpt, luego categoría)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(query);
      const bTitle = b.title.toLowerCase().includes(query);
      const aProduct = a.productNames?.some(name => name.toLowerCase().includes(query)) || false;
      const bProduct = b.productNames?.some(name => name.toLowerCase().includes(query)) || false;
      
      // Prioridad: título > producto > resto
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      if (aProduct && !bProduct) return -1;
      if (!aProduct && bProduct) return 1;
      
      return 0;
    });
    
    // Limitar resultados a 10
    const limitedResults = results.slice(0, 10);
    
    res.status(200).json({ 
      results: limitedResults,
      total: results.length 
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getCategoryDisplayName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    'cocina': 'Cocina',
    'belleza': 'Belleza',
    'jardin': 'Jardín',
    'maquillaje': 'Maquillaje',
    'ropa': 'Ropa',
    'hogar': 'Hogar',
    'tecnologia': 'Tecnología',
    'deportes': 'Deportes',
    'salud': 'Salud',
    'moda': 'Moda',
    'mascotas': 'Mascotas',
    'electrodomesticos': 'Electrodomésticos',
    'libros': 'Libros'
  };
  
  return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
}
