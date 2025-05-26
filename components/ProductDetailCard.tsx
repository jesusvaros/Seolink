import React from 'react';

export type DetailedProduct = {
  asin: string;
  name: string;
  subtitle?: string;
  image: string;
  affiliateLink: string;
  price: string;
  capacity: string;
  vapor?: boolean;
  limpieza?: string;
  peso?: string;
  dimensiones?: string;
  potencia?: string;
  pros?: string;
  cons?: string;
  description?: string;
  [key: string]: any; // Allow for additional properties
};

const ProductDetailCard: React.FC<{ product: DetailedProduct }> = ({ product }) => {
  // Split pros and cons into arrays if they're provided as comma-separated strings
  const prosList = product.pros ? product.pros.split(',').map(item => item.trim()) : [];
  const consList = product.cons ? product.cons.split(',').map(item => item.trim()) : [];

  // Create an array of specification items for the table
  const specifications = [
    { label: 'Capacidad', value: product.capacity },
    { label: 'Función vapor', value: product.vapor ? '✓' : '✗' },
    { label: 'Sistema de limpieza', value: product.limpieza || 'No especificado' },
    { label: 'Peso', value: product.peso },
    { label: 'Dimensiones', value: product.dimensiones },
    { label: 'Potencia', value: product.potencia },
  ].filter(spec => spec.value); // Only include specs that have values

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-10 border border-gray-200">
      {/* Header with image and basic info */}
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 p-4 flex items-center justify-center bg-gray-50">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full max-w-xs h-auto object-contain"
          />
        </div>
        <div className="md:w-2/3 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
          {product.subtitle && (
            <p className="text-lg text-gray-600 mb-4">{product.subtitle}</p>
          )}
          
          <div className="mt-4">
            <a
              href={product.affiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-center w-full md:w-auto"
            >
              Ver precio: {product.price}
            </a>
          </div>
        </div>
      </div>

      {/* Pros and Cons */}
      <div className="px-6 py-4 border-t border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Pros y Contras</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-700 mb-2">Pros</h4>
            <ul className="list-disc pl-5 space-y-1">
              {prosList.length > 0 ? (
                prosList.map((pro, index) => (
                  <li key={`pro-${index}`} className="text-gray-700">{pro}</li>
                ))
              ) : (
                <li className="text-gray-500 italic">No se han especificado ventajas</li>
              )}
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-700 mb-2">Contras</h4>
            <ul className="list-disc pl-5 space-y-1">
              {consList.length > 0 ? (
                consList.map((con, index) => (
                  <li key={`con-${index}`} className="text-gray-700">{con}</li>
                ))
              ) : (
                <li className="text-gray-500 italic">No se han especificado desventajas</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="px-6 py-4 border-t border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Descripción</h3>
          <div className="text-gray-700 space-y-4">
            <p>{product.description}</p>
            <p>
              Este {product.name} es una excelente opción para quienes buscan un producto
              de calidad con buena relación calidad-precio. Sus características técnicas y su
              diseño lo convierten en una opción muy recomendable.
            </p>
          </div>
        </div>
      )}

      {/* Specifications Table */}
      <div className="px-6 py-4 border-t border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Especificaciones</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              {specifications.map((spec, index) => (
                spec.value && (
                  <tr key={`spec-${index}`} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                      {spec.label}
                    </td>
                    <td className="px-6 py-3 text-left text-sm text-gray-500">
                      {spec.value}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call to action footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <a
          href={product.affiliateLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
        >
          Ver más detalles y opiniones
        </a>
      </div>
    </div>
  );
};

export default ProductDetailCard;
