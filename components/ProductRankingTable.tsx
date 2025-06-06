import React from 'react';
import { Product } from './ProductTable';

interface ProductRankingTableProps {
  products?: Product[] | null;
}

export default function ProductRankingTable({ products }: ProductRankingTableProps) {
  // Si products es undefined, null o no es un array, devolvemos null (no renderizar nada)
  if (!products || !Array.isArray(products) || products.length === 0) {
    console.warn('ProductRankingTable: No se han proporcionado productos válidos');
    return null;
  }
  return (
    <div className="my-8">
      {/* Vista de escritorio (tabla) - Se oculta en móviles */}
      <div className="hidden md:block border border-gray-200 rounded-md shadow-sm">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3 w-16">#</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Destacado</th>
              <th className="px-4 py-3">Comprar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product, index) => (
              <tr key={product.asin} className="hover:bg-gray-50">
                {/* Número */}
                <td className="px-4 py-3 text-center font-bold">
                  {index + 1}
                </td>
                
                {/* Modelo con imagen */}
                <td className="flex items-center gap-4 px-4 py-3">
                  <img
                    src={product.image.url}
                    alt={product.image.caption || product.name}
                    className="w-12 h-12 object-contain rounded"
                  />
                  <div>
                    <a
                      href={product.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:underline font-medium"
                    >
                      {product.name}
                    </a>
                  </div>
                </td>
                
                {/* Propiedad destacada */}
                <td className="px-4 py-3">
                  {product.destacado && (
                    <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 text-xs font-medium">
                      {product.destacado}
                    </span>
                  )}
                </td>
                
                {/* Botón de compra */}
                <td className="px-4 py-3">
                  <a
                    href={product.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 transition-colors duration-200 text-center w-36"
                  >
                    Comprar {product.price && `· ${typeof product.price === 'object' ? product.price.display : product.price}`}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista móvil (tarjetas) - Solo se muestra en móviles */}
      <div className="md:hidden space-y-6">
        {products.map((product, index) => (
          <div key={product.asin} className="border border-gray-200 rounded-md shadow-sm bg-white">
            {/* Encabezado de la tarjeta con número, imagen y nombre */}
            <div className="flex items-center p-4 border-b border-gray-200">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mr-3 flex-shrink-0">
                <span className="font-bold">{index + 1}</span>
              </div>
              <div className="flex items-center gap-3 flex-grow overflow-hidden">
                <img
                  src={product.image.url}
                  alt={product.image.caption || product.name}
                  className="w-16 h-16 object-contain rounded flex-shrink-0"
                />
                <a
                  href={product.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-800 hover:underline font-medium line-clamp-2"
                >
                  {product.name}
                </a>
              </div>
            </div>
            
            {/* Propiedad destacada (si existe) */}
            {product.destacado && (
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Destacado</span>
                  <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 text-xs font-medium">
                    {product.destacado}
                  </span>
                </div>
              </div>
            )}
            
            {/* Botón de compra */}
            <div className="p-4 pt-3">
              <a
                href={product.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-md text-center transition-colors duration-200"
              >
                Comprar {product.price && `· ${typeof product.price === 'object' ? product.price.display : product.price}`}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
