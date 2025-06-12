import React, { useEffect, useState } from 'react';
import ArticleCard from './ArticleCard';
import Link from 'next/link';

interface ImageObject {
  '@type'?: 'ImageObject';
  url: string;
  caption?: string;
}

interface RelatedArticlesProps {
  category: string;
  currentSlug: string;
  showImage?: boolean;
}

interface ArticleInfo {
  title: string;
  slug: string;
  image: ImageObject; // Changed from string
  category?: string; // Categoría del artículo (opcional)
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ category, currentSlug ,showImage}) => {
  const [relatedArticles, setRelatedArticles] = useState<ArticleInfo[]>([]);
  
  useEffect(() => {
    fetch('/api/related-articles?category=' + category + '&currentSlug=' + currentSlug)
      .then(response => response.json())
      .then(data => {
        setRelatedArticles(data);
      })
      .catch(error => {
        console.error('Error fetching related articles:', error);
      });
  }, [category, currentSlug]);

  if (relatedArticles.length === 0) {
    return null;
  }
  
  // Nombres amigables para las categorías
  const categoryNames: { [key: string]: string } = {
    cocina: 'Cocina',
    belleza: 'Belleza',
    jardin: 'Jardín',
    maquillaje: 'Maquillaje',
    ropa: 'Ropa',
    hogar: 'Hogar',
    tecnologia: 'Tecnología',
    ocio: 'Ocio'
  };

  // Different rendering based on showImage prop
  if (!showImage) {
    return (
      <div className="mt-4 mb-4">
        <ul className="list-disc space-y-3">
          {relatedArticles.slice(0, 4).map((article) => (
            <li key={article.slug}>
              <Link href={`/${article.slug}`}>
                <span className="text-base  text-gray-800 underline text-size-lg">{article.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Default rendering with images
  return (
    <div className="mt-16 mb-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Artículos que también te pueden interesar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedArticles.map((article) => (
          <div key={article.slug} className="group">
            <ArticleCard
              title={article.title}
              image={article.image}
              slug={article.slug}
            />
            {article.category && article.category !== category && (
              <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                {categoryNames[article.category] || article.category}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedArticles;
