import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Define interface for article structure
interface Article {
  title: string;
  slug: string;
  image: string;
  category?: string; // Categoría del artículo (opcional)
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, currentSlug } = req.query;
    
    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' });
    }
    
    // Read the categories.json file
    const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
    const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
    const categories = JSON.parse(categoriesData);
    
    // Get articles from the specified category
    const categoryArticles = categories[category as string] || [];
    
    // Filter out the current article 
    let relatedArticles = categoryArticles
      .filter((article: Article) => article.slug !== currentSlug);
    
    // Si no hay suficientes artículos relacionados (al menos 3), obtener de otras categorías
    if (relatedArticles.length < 3) {
      // Obtener artículos de otras categorías
      const otherArticles: Article[] = [];
      
      // Recorrer todas las categorías excepto la actual
      Object.keys(categories).forEach((cat) => {
        if (cat !== category && categories[cat] && categories[cat].length > 0) {
          // Añadir artículos de esta categoría si no son el artículo actual
          categories[cat].forEach((article: Article) => {
            if (article.slug !== currentSlug) {
              // Añadir información de categoría al artículo
              otherArticles.push({
                ...article,
                category: cat // Añadir la categoría para mostrarla en la UI
              });
            }
          });
        }
      });
      
      // Ordenar aleatoriamente para diversidad
      otherArticles.sort(() => Math.random() - 0.5);
      
      // Añadir suficientes artículos para llegar a 3 o más
      const neededArticles = Math.max(0, 3 - relatedArticles.length);
      const additionalArticles = otherArticles.slice(0, neededArticles);
      
      // Combinar artículos de la misma categoría con artículos de otras
      relatedArticles = [...relatedArticles, ...additionalArticles];
    }
    
    // Limitar a 6 artículos máximo
    relatedArticles = relatedArticles.slice(0, 6);
    
    return res.status(200).json(relatedArticles);
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return res.status(500).json({ error: 'Failed to fetch related articles' });
  }
}
