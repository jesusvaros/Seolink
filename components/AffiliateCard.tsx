import React from 'react';

interface ImageObject {
  '@type'?: 'ImageObject';
  url: string;
  caption?: string;
}

type Product = {
  asin: string;
  name: string;
  image: ImageObject;
  affiliateLink: string;
};

export default function AffiliateCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-col items-center">
      <img src={product?.image?.url} alt={product?.image?.caption || product?.name} className="w-32 h-32 object-contain mb-2" />
      <h3 className="font-semibold text-lg mb-1 text-center">{product?.name}</h3>
      <a
        href={product?.affiliateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 px-4 py-2 bg-yellow-500 text-white font-bold rounded hover:bg-yellow-600 transition"
      >
        Comprar en Amazon
      </a>
    </div>
  );
}
