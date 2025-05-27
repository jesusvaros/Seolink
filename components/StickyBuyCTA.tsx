import Link from 'next/link';

interface Product {
  name?: string;
  title?: string; // Para mantener compatibilidad
  price?: string;
  affiliateLink: string;
  image?: string;
}

export default function StickyBuyCTA({ product }: { product: Product }) {
  if (!product) return null;
  
  // Usar title o name según lo que esté disponible
  const productName = product.name || product.title || 'Producto recomendado';
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-lg p-3 flex justify-between items-center md:hidden z-50">
      <div className="flex flex-col mr-2 overflow-hidden">
        <p className="text-xs font-bold text-gray-600">PRODUCTO RECOMENDADO</p>
        <p className="text-sm font-medium truncate">{productName}</p>
        {product.price && <p className="text-sm font-bold text-orange-600">{product.price}</p>}
      </div>
      <Link
        href={product.affiliateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition duration-200"
      >
        Comprar ahora
      </Link>
    </div>
  );
}
