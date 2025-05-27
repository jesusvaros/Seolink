import React from 'react';

export type DetailedProduct = {
  asin: string;
  name: string;
  subtitle?: string;
  image: string;
  affiliateLink: string;
  price: string;
  capacity?: string;
  vapor?: boolean;
  limpieza?: string;
  peso?: string;
  dimensiones?: string;
  potencia?: string;
  pros?: string;
  cons?: string;
  description?: string;
  detailedDescription?: string;
  [key: string]: any; // Allow for additional properties
};

const ProductDetailCard: React.FC<{ product: DetailedProduct }> = ({ product }) => {
  // Split pros and cons into arrays if they're provided as comma-separated strings
  const prosList = product.pros ? product.pros.split(',').map(item => item.trim()) : [];
  const consList = product.cons ? product.cons.split(',').map(item => item.trim()) : [];

  // Create an array of specification items for the table, only including properties that exist
  const specifications = [
    product.capacity ? { label: 'Capacidad', value: product.capacity } : null,
    product.vapor !== undefined ? { label: 'Función vapor', value: product.vapor ? '✓' : '✗' } : null,
    product.limpieza ? { label: 'Sistema de limpieza', value: product.limpieza } : null,
    product.peso ? { label: 'Peso', value: product.peso } : null,
    product.dimensiones ? { label: 'Dimensiones', value: product.dimensiones } : null,
    product.potencia ? { label: 'Potencia', value: product.potencia } : null,
  ].filter(spec => spec !== null); // Filter out null items

  return (
    <div className="mb-8">
      {/* Header with image and basic info */}
      <div className="flex flex-col md:flex-row mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="md:w-1/4 flex items-center justify-center">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full max-h-40 object-contain"
          />
        </div>
        <div className="md:w-3/4 md:pl-6 pt-4 md:pt-0">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h2>
          {product.subtitle && (
            <p className="text-base text-gray-600 mb-4">{product.subtitle}</p>
          )}
          
          <div className="mt-4">
            <a
              href={product.affiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-center w-full md:w-auto mr-3"
            >
              Ver precio: {product.price}
            </a>
            <a
              href={product.affiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-center mt-2 md:mt-0"
            >
              Ver en Amazon
            </a>
          </div>
        </div>
      </div>

      {/* Description */}
      {(product.description || product.detailedDescription) && (
        <div className="my-6">
          <div className="text-gray-700 text-base leading-relaxed">
            {product.detailedDescription ? (
              <p>{product.detailedDescription}</p>
            ) : product.description ? (
              <p>{product.description}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Pros and Cons */}
      {(prosList.length > 0 || consList.length > 0) && (
        <div className="my-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prosList.length > 0 && (
              <div className="bg-green-50 px-4 py-3 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-1 text-base mt-2">Pros</h3>
                <ul className="list-disc pl-5 space-y-0.5">
                  {prosList.map((pro, index) => (
                    <li key={`pro-${index}`} className="text-gray-700">{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            {consList.length > 0 && (
              <div className="bg-red-50 px-4 py-3 rounded-lg">
                <h3 className="font-semibold text-red-700 mb-1 text-base mt-2">Contras</h3>
                <ul className="list-disc pl-5 space-y-0.5">
                  {consList.map((con, index) => (
                    <li key={`con-${index}`} className="text-gray-700">{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specifications */}
      {specifications.length > 0 && (
        <div className="my-6">
          <h3 className="font-semibold text-gray-700 mb-3 text-lg">Especificaciones</h3>
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {specifications.map((spec, index) => (
                  <tr key={`spec-${index}`} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                      {spec.label}
                    </td>
                    <td className="px-6 py-3 text-left text-sm text-gray-500">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailCard;
