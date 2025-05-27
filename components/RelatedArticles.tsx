import React, { useEffect, useState } from 'react';
import ArticleCard from './ArticleCard';

interface RelatedArticlesProps {
  category: string;
  currentSlug: string;
}

interface ArticleInfo {
  title: string;
  slug: string;
  image: string;
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ category, currentSlug }) => {
  const [relatedArticles, setRelatedArticles] = useState<ArticleInfo[]>([]);
  
  useEffect(() => {
    // Fetch the categories.json data
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

  return (
    <div className="mt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedArticles.map((article) => (
          <ArticleCard
            key={article.slug}
            title={article.title}
            image={article.image}
            slug={article.slug}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedArticles;
