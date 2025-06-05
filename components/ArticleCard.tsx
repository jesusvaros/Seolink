import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  title: string;
  image: string;
  slug: string;
  excerpt?: string; // Opcional para mostrar un extracto del artículo
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, image, slug, excerpt }) => {
  return (
    <Link href={`/${slug}`} className="block w-full">
      <div className="bg-white shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg pt-3">
        <div className="relative w-full h-48">
          <Image 
            src={image} 
            alt={title}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{title}</h3>
          {excerpt && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-3">{excerpt}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
