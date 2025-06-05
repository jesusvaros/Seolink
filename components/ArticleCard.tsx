import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ImageObject {
  '@type'?: 'ImageObject';
  url: string;
  caption?: string;
}

interface ArticleCardProps {
  title: string;
  image: ImageObject;
  slug: string;
  excerpt?: string; // Opcional para mostrar un extracto del artículo
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, image, slug, excerpt }) => {
  const placeholderUrl = '/default-placeholder.jpg';
  const imageUrlString = (image && typeof image.url === 'string') ? image.url : null;
  const trimmedUrl = imageUrlString ? imageUrlString.trim() : null;

  let finalImageUrl = placeholderUrl; // Default to placeholder

  if (trimmedUrl && 
      trimmedUrl !== 'PENDIENTE_URL_IMAGEN_PRODUCTO' &&
      (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('http'))) {
    finalImageUrl = trimmedUrl;
  }

  return (
    <Link href={`/${slug}`} className="block w-full">
      <div className="bg-white shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg pt-3">
        <div className="relative w-full h-48">
          <Image 
            src={finalImageUrl} 
            alt={image.caption || title}
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


