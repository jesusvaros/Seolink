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
    return (
      <div className="overflow-x-auto my-8 border rounded-md shadow-sm">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Capacidad</th>
              <th className="px-4 py-3">Vapor</th>
              <th className="px-4 py-3">Limpieza</th>
              <th className="px-4 py-3">Precio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.asin} className="hover:bg-gray-50">
                <td className="flex items-center gap-4 px-4 py-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-12 h-12 object-contain rounded"
                  />
                  <a
                    href={p.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {p.name}
                  </a>
                </td>
                <td className="px-4 py-3">{p.capacity}</td>
                <td className="px-4 py-3 text-center">
                  {p.vapor ? '✅' : '❌'}
                </td>
                <td className="px-4 py-3">{p.limpieza}</td>
                <td className="px-4 py-3 font-semibold">{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  