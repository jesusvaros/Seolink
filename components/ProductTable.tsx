export type Product = {
    asin: string;
    name: string;
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
  };
  
  export default function ProductTable({ products }: { products: Product[] }) {
    // Determinar qué propiedades están disponibles en los productos
    const availableProps = {
      capacity: products.some(p => p.capacity),
      potencia: products.some(p => p.potencia),
      dimensiones: products.some(p => p.dimensiones),
      peso: products.some(p => p.peso),
      vapor: products.some(p => p.vapor !== undefined),
      limpieza: products.some(p => p.limpieza)
    };

    // Generar encabezados basados en las propiedades disponibles
    const headers = [
      { key: 'number', label: '#', alwaysShow: true },
      { key: 'name', label: 'Modelo', alwaysShow: true },
      { key: 'capacity', label: 'Capacidad', show: availableProps.capacity },
      { key: 'potencia', label: 'Potencia', show: availableProps.potencia },
      { key: 'dimensiones', label: 'Dimensiones', show: availableProps.dimensiones },
      { key: 'peso', label: 'Peso', show: availableProps.peso },
      { key: 'vapor', label: 'Vapor', show: availableProps.vapor },
      { key: 'limpieza', label: 'Limpieza', show: availableProps.limpieza },
      { key: 'price', label: 'Precio', alwaysShow: true }
    ].filter(header => header.alwaysShow || header.show);

    return (
      <div className="overflow-x-auto my-8 border rounded-md shadow-sm">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-800 font-semibold">
            <tr>
              {headers.map((header) => (
                <th key={header.key} className="px-4 py-3">{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p, index) => (
              <tr key={p.asin} className="hover:bg-gray-50">
                {headers.map((header) => {
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
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 object-contain rounded"
                        />
                        <div>
                          <span className="font-bold inline-block mr-2 text-xs bg-gray-200 rounded-full w-6 h-6 text-center leading-6">{index + 1}</span>
                          <a
                            href={p.affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {p.name}
                          </a>
                        </div>
                      </td>
                    );
                  }
                  if (header.key === 'vapor') {
                    return (
                      <td key={header.key} className="px-4 py-3 text-center">
                        {p.vapor ? '✅' : '❌'}
                      </td>
                    );
                  }
                  if (header.key === 'price') {
                    return (
                      <td key={header.key} className="px-4 py-3 font-semibold">{p.price}</td>
                    );
                  }
                  return (
                    <td key={header.key} className="px-4 py-3">{p[header.key as keyof Product] || '-'}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }