import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUmami } from '../hooks/useUmami';

interface ImageObject {
  '@type': 'ImageObject';
  url: string;
  caption?: string;
}

type Product = {
  asin: string;
  name: string;
  image: ImageObject;
  affiliateLink: string;
};

interface AffiliateCardProps {
  product: Product;
  className?: string;
  priorityImage?: boolean;
}

export default function AffiliateCard({ product, className, priorityImage }: AffiliateCardProps) {
  const { trackAffiliateClick } = useUmami();
  
  const imageUrlString = (product && product.image && typeof product.image.url === 'string') 
                         ? product.image.url 
                         : null;
  const trimmedUrl = imageUrlString ? imageUrlString.trim() : null;

  const isSafeToUseAsSrc = trimmedUrl &&
                           trimmedUrl !== 'PENDIENTE_URL_IMAGEN_PRODUCTO' &&
                           (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('http'));

  const handleAffiliateClick = () => {
    trackAffiliateClick(product?.name || 'Unknown Product', product?.asin || 'Unknown ASIN');
  };

  return (
    <div className={`${className} group bg-white rounded shadow p-4 flex flex-col items-center text-center`}>
      <div className="w-32 h-32 relative mb-2 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
        {isSafeToUseAsSrc ? (
          <Image
            src={trimmedUrl!}
            alt={product.image.caption || product.name || 'Product image'}
            layout="fill"
            objectFit="contain"
            className="group-hover:opacity-75"
            priority={priorityImage}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10zm-9.414-5.414a1 1 0 011.414 0L10 11.586l2.586-2.586a1 1 0 111.414 1.414L11.414 13l2.586 2.586a1 1 0 01-1.414 1.414L10 14.414l-2.586 2.586a1 1 0 01-1.414-1.414L8.586 13 6 10.414a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-sm md:text-base mb-1 text-center h-12 overflow-hidden">{product?.name || 'Product Name'}</h3>
      <Link
        href={product?.affiliateLink || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAffiliateClick}
        className="mt-2 px-3 py-1.5 bg-yellow-400 text-gray-800 font-semibold rounded hover:bg-yellow-500 transition text-xs md:text-sm w-full"
      >
        Comprar en Amazon
      </Link>
    </div>
  );
}
