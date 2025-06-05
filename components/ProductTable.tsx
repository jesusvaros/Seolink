import React from 'react';

interface ImageObject {
  '@type'?: 'ImageObject';
  url: string;
  caption?: string;
}

export type Product = {
  asin: string;
  name: string;
  subtitle?: string;
  image: ImageObject;
  affiliateLink: string;
  price: string | { display: string; schema: string };
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
  [key: string]: any; // Permitir propiedades dinámicas adicionales
};

export default function ProductTable({ products }: { products: Product[] }) {
  // Propiedades que siempre queremos excluir de la tabla
  const excludedProps = ['asin', 'name', 'image', 'affiliateLink', 'price', 'pros', 'cons', 'description', 'detailedDescription', 'subtitle', 'destacado'];

  // Detectar automáticamente todas las propiedades disponibles en los productos
  const availableProps: Record<string, boolean> = {};
  
  // Obtener todas las propiedades únicas de todos los productos
  products.forEach(product => {
    Object.keys(product).forEach(key => {
      // Solo considerar propiedades que no estén en la lista de exclusión
      if (!excludedProps.includes(key) && product[key] !== undefined && product[key] !== null) {
        availableProps[key] = true;
      }
    });
  });
  
  // Mapeo de nombres de propiedades a etiquetas más amigables
  const propertyLabels: Record<string, string> = {
    capacity: 'Capacidad',
    potencia: 'Potencia',
    dimensiones: 'Dimensiones',
    peso: 'Peso',
    vapor: 'Vapor',
    limpieza: 'Limpieza',
    // Puedes agregar más mapeos según sea necesario
  };
  
  // Definir los tipos de encabezados para evitar problemas de TypeScript
  type HeaderType = { key: string; label: string; } & ({ alwaysShow: boolean } | { show: boolean });
  
  // Generar encabezados dinámicamente basados en las propiedades disponibles
  const headers: HeaderType[] = [
    { key: 'number', label: '#', alwaysShow: true },
    { key: 'name', label: 'Modelo', alwaysShow: true },
    // Agregar dinámicamente los encabezados para las propiedades detectadas
    ...Object.keys(availableProps).map(key => ({
      key,
      label: propertyLabels[key] || key.charAt(0).toUpperCase() + key.slice(1), // Capitalizar si no hay etiqueta personalizada
      show: true
    })),
    { key: 'price', label: 'Comprar', alwaysShow: true }
  ];
  
  // Filtrar encabezados usando una función de tipo guard para TypeScript
  const filteredHeaders = headers.filter((header): header is HeaderType => 
    'alwaysShow' in header ? header.alwaysShow : 'show' in header ? header.show : false
  );

  // Formatear valores de celda según el tipo de propiedad
  const formatCellValue = (product: Product, key: string): React.ReactNode => {
    if (key === 'vapor' || typeof product[key] === 'boolean') {
      return product[key] ? '✅' : '❌';
    }
    
    // Si es un número, formatearlo adecuadamente
    if (typeof product[key] === 'number') {
      return product[key].toString();
    }
    
    return product[key] || '-';
  };

  return (
    <div className="my-8">
      {/* Vista de escritorio (tabla) - Se oculta en móviles */}
      <div className="hidden md:block border border-gray-200 rounded-md shadow-sm">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-800 font-semibold">
            <tr>
              {filteredHeaders.map((header) => (
                <th key={header.key} className="px-4 py-3">{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product, index) => (
              <tr key={product.asin} className="hover:bg-gray-50">
                {filteredHeaders.map((header) => {
                  if (header.key === 'number') {
                    return (
                      <td key={header.key} className="px-4 py-3 text-center font-bold">
                        {index + 1}
                      </td>
                    );
                  }
                  
                  if (header.key === 'name') {
                    return (
                      <td key={header.key} className="flex items-center gap-4 px-4 py-3">
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
                    );
                  }
                  
                  if (header.key === 'price') {
                    return (
                      <td key={header.key} className="px-4 py-3">
                        <a
                          href={product.affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 transition-colors duration-200 text-center w-36"
                        >
                          Comprar {product.price && `· ${product.price}`}
                        </a>
                      </td>
                    );
                  }
                  
                  return (
                    <td key={header.key} className="px-4 py-3">
                      {formatCellValue(product, header.key)}
                    </td>
                  );
                })}
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
              <div className="flex items-center gap-3 flex-grow">
                <img
                  src={product.image.url}
                  alt={product.image.caption || product.name}
                  className="w-16 h-16 object-contain rounded flex-shrink-0"
                />
                <a
                  href={product.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-800 hover:underline font-medium"
                >
                  {product.name}
                </a>
              </div>
            </div>
            
            {/* Detalles del producto */}
            <div className="p-4 space-y-2">
              {filteredHeaders.map((header) => {
                // Omitir number, name y price que ya se muestran en otras secciones
                if (['number', 'name', 'price'].includes(header.key)) {
                  return null;
                }
                
                return (
                  <div key={header.key} className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">{header.label}</span>
                    <span className="text-gray-900">{formatCellValue(product, header.key)}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Botón de compra */}
            <div className="p-4 pt-2 border-t border-gray-200">
              <a
                href={product.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-md text-center transition-colors duration-200"
              >
                Comprar {product.price && `· ${product.price}`}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}