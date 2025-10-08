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
  category?: string; // Opcional para especificar la categoría del artículo
  date?: string; // Opcional para mostrar la fecha de publicación
  useCategory?: boolean; // Opcional para indicar si usar la ruta con categoría
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, image, slug, excerpt, category, date, useCategory = false }) => {
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

  // Determine the correct URL path based on props
  const articleUrl = useCategory && category 
    ? `/categorias/${category}/${slug}` 
    : `/${slug}`;

  // Function to calculate relative time
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    
    const now = new Date();
    const articleDate = new Date(dateString);
    const diffInMs = now.getTime() - articleDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
    }
    const years = Math.floor(diffInDays / 365);
    return years === 1 ? 'Hace 1 año' : `Hace ${years} años`;
  };

  return (
    <Link href={articleUrl} className="block w-full group">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100">
        <div className="relative w-full h-48 overflow-hidden">
          <Image 
            src={finalImageUrl} 
            alt={typeof image === 'object' && image.caption ? image.caption : title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {category && (
            <div className="absolute top-3 left-3">
              <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                {category}
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors duration-200">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-3 leading-relaxed">{excerpt}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {date && (
                <span className="text-xs text-gray-400">
                  🕒 {getRelativeTime(date)}
                </span>
              )}
            </div>
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;


