import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  title: string;
  image: string;
  slug: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, image, slug }) => {
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
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
