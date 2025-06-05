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
  image: ImageObject | string; // Accept either ImageObject or string
  slug: string;
  excerpt?: string; // Opcional para mostrar un extracto del artículo
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, image, slug, excerpt }) => {
  const placeholderUrl = '/default-placeholder.jpg';
  
  // More robust image URL handling
  let finalImageUrl = placeholderUrl; // Default to placeholder
  
  try {
    // Handle different image formats (string, object with url, etc)
    const imageUrl = typeof image === 'string' ? image : 
                    image && typeof image.url === 'string' ? image.url : 
                    image && typeof image === 'object' ? JSON.stringify(image) : null;
    
    // Clean and validate URL
    if (imageUrl) {
      const trimmedUrl = imageUrl.trim();
      
      // Check for valid URL format and exclude placeholder text
      if (trimmedUrl && 
          !trimmedUrl.includes('PENDIENTE') &&
          !trimmedUrl.includes('undefined') &&
          (trimmedUrl.startsWith('/') || 
           trimmedUrl.startsWith('http') || 
           trimmedUrl.startsWith('https'))) {
        finalImageUrl = trimmedUrl;
      }
    }
  } catch (error) {
    console.error('Error processing image URL:', error);
    // Fallback to placeholder on any error
  }

  return (
    <Link href={`/${slug}`} className="block w-full">
      <div className="bg-white shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg pt-3">
        <div className="relative w-full h-48">
          <Image 
            src={finalImageUrl} 
            alt={typeof image === 'object' && image.caption ? image.caption : title}
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


