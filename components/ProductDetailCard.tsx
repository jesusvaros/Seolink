import React from 'react';

interface ImageObject {
  '@type'?: 'ImageObject';
  url: string;
  caption?: string;
}

export type DetailedProduct = {
  asin: string;
  name: string;
  subtitle?: string;
  image: ImageObject;
  affiliateLink: string;
  price: string | { display: string; schema: string };
  pros?: string;
  cons?: string;
  description?: string;
  detailedDescription?: string;
  specifications?: Record<string, any>;
  technicalSpecifications?: Record<string, any>;
  especificaciones?: Record<string, any>;
  [key: string]: any; // Allow for additional properties
};

// Tipo para las especificaciones
interface Specification {
  label: string;
  value: string | number | boolean;
}

const ProductDetailCard: React.FC<{ product?: DetailedProduct }> = ({ product }) => {
  // Si el producto es undefined, devolvemos null (no renderizar nada)
  if (!product) {
    console.warn('ProductDetailCard: No se ha proporcionado un producto válido');
    return null;
  }
  
  // Split pros and cons into arrays if they're provided as comma-separated strings
  const prosList = product.pros ? (Array.isArray(product.pros) ? product.pros : String(product.pros).split(',').map(item => item.trim())) : [];
  const consList = product.cons ? (Array.isArray(product.cons) ? product.cons : String(product.cons).split(',').map(item => item.trim())) : [];

  // Función para procesar las especificaciones de cualquier tipo de producto
  const processTechnicalSpecs = (): Specification[] => {
    const specs: Specification[] = [];
    
    // Lista de propiedades básicas que no queremos mostrar como especificaciones
    const basicProps = [
      'asin', 'name', 'subtitle', 'image', 'affiliateLink', 'price',
      'pros', 'cons', 'description', 'detailedDescription', 'destacado'
    ];
    
    // 1. Procesar objetos de especificaciones anidados
    const specObjects: Record<string, any>[] = [];
    
    // Intentar todos los posibles nombres de objetos de especificaciones
    if (product.specifications && typeof product.specifications === 'object') {
      specObjects.push(product.specifications);
    }
    if (product.technicalSpecifications && typeof product.technicalSpecifications === 'object') {
      specObjects.push(product.technicalSpecifications);
    }
    if (product.especificaciones && typeof product.especificaciones === 'object') {
      specObjects.push(product.especificaciones);
    }
    
    // Procesar todos los objetos de especificaciones encontrados
    specObjects.forEach(specObj => {
      try {
        Object.entries(specObj).forEach(([key, value]) => {
          // Solo procesar valores válidos
          if (value !== undefined && value !== null && value !== '' && value !== 'N/A') {
            // Formato del nombre de la propiedad
            const formattedKey = key
              .charAt(0).toUpperCase() + 
              key.slice(1)
                .replace(/([A-Z])/g, ' $1') // Separar camelCase
                .replace(/_/g, ' ')          // Cambiar guiones bajos por espacios
                .replace(/-/g, ' ')          // Cambiar guiones por espacios
                .trim();
            
            // Procesar el valor dependiendo del tipo
            let processedValue: string | number | boolean;
            if (value === null || value === undefined) {
              return; // Saltar valores nulos o indefinidos
            } else if (typeof value === 'object') {
              try {
                processedValue = JSON.stringify(value);
              } catch {
                processedValue = 'Objeto complejo';
              }
            } else if (typeof value === 'boolean') {
              processedValue = value ? '✓' : '✗';
            } else {
              processedValue = String(value);
            }
            
            specs.push({
              label: formattedKey,
              value: processedValue
            });
          }
        });
      } catch (error) {
        // Continuar con otras especificaciones si hay algún error
        console.error('Error procesando especificaciones:', error);
      }
    });
    
    // 2. Procesar propiedades directas del producto que no son básicas
    Object.entries(product).forEach(([key, value]) => {
      // Excluir propiedades básicas, objetos de especificaciones, y valores inválidos
      if (!basicProps.includes(key) && 
          key !== 'specifications' && 
          key !== 'technicalSpecifications' &&
          key !== 'especificaciones' &&
          typeof value !== 'object' &&
          value !== undefined && 
          value !== null && 
          value !== '' &&
          value !== 'N/A') {
        
        // Formato del nombre de la propiedad
        const formattedKey = key
          .charAt(0).toUpperCase() + 
          key.slice(1)
            .replace(/([A-Z])/g, ' $1') // Separar camelCase
            .replace(/_/g, ' ')          // Cambiar guiones bajos por espacios
            .replace(/-/g, ' ')          // Cambiar guiones por espacios
            .trim();
        
        // Procesar el valor dependiendo del tipo
        const processedValue = typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value);
        
        specs.push({
          label: formattedKey,
          value: processedValue
        });
      }
    });
    
    return specs;
  };
  
  // Obtenemos todas las especificaciones procesadas
  const specifications = processTechnicalSpecs();

  return (
    <div className="mb-8">
      {/* Header with image and basic info */}
      <div className="flex flex-col md:flex-row mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="md:w-1/4 flex items-center justify-center">
          <img
            src={product.image.url}
            alt={product.image.caption || product.name}
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
              Ver precio: {typeof product.price === 'object' ? product.price.display : product.price}
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
