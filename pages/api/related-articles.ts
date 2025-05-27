import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Define interface for article structure
interface Article {
  title: string;
  slug: string;
  image: string;
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
    
    // Filter out the current article and limit to 6 articles
    const relatedArticles = categoryArticles
      .filter((article: Article) => article.slug !== currentSlug)
      .slice(0, 6);
    
    return res.status(200).json(relatedArticles);
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return res.status(500).json({ error: 'Failed to fetch related articles' });
  }
}
