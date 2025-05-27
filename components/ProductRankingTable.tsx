import React from 'react';
import { Product } from './ProductTable';

interface ProductRankingTableProps {
  products: Product[];
}

export default function ProductRankingTable({ products }: ProductRankingTableProps) {
  return (
    <div className="overflow-x-auto my-8 border border-gray-200 rounded-md shadow-sm">
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
                  src={product.image}
                  alt={product.name}
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
                  Comprar {product.price && `· ${product.price}`}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
