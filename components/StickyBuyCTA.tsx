import Link from 'next/link';

export default function StickyBuyCTA({ product }: { product: any }) {
  if (!product) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-lg p-4 flex justify-between items-center md:hidden z-50">
      <div>
        <p className="text-sm font-medium">{product.title}</p>
        <p className="text-xs text-gray-600">{product.price}</p>
      </div>
      <Link
        href={product.affiliateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-orange-600 text-white px-4 py-2 text-sm font-semibold rounded-md"
      >
        Comprar
      </Link>
    </div>
  );
}
