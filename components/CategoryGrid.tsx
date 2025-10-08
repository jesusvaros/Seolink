import Link from 'next/link';

interface CategoryGridProps {
  categories: { [key: string]: any[] };
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const categoryConfig: { [key: string]: { name: string; icon: string; color: string; bgColor: string } } = {
    'cocina': {
      name: 'Cocina',
      icon: '🍳',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    'belleza': {
      name: 'Belleza',
      icon: '✨',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100'
    },
    'maquillaje': {
      name: 'Maquillaje',
      icon: '💄',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 hover:bg-rose-100'
    },
    'hogar': {
      name: 'Hogar',
      icon: '🏠',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    'ropa': {
      name: 'Ropa',
      icon: '👕',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    'tecnologia': {
      name: 'Tecnología',
      icon: '💻',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    },
    'jardin': {
      name: 'Jardín',
      icon: '🌱',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    'deportes': {
      name: 'Deportes',
      icon: '⚽',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100'
    },
    'salud': {
      name: 'Salud',
      icon: '🏥',
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100'
    },
    'mascotas': {
      name: 'Mascotas',
      icon: '🐕',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 hover:bg-amber-100'
    },
    'electrodomesticos': {
      name: 'Electrodomésticos',
      icon: '🔌',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 hover:bg-slate-100'
    },
    'libros': {
      name: 'Libros',
      icon: '📚',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100'
    },
    'moda': {
      name: 'Moda',
      icon: '👗',
      color: 'text-fuchsia-600',
      bgColor: 'bg-fuchsia-50 hover:bg-fuchsia-100'
    }
  };

  const displayCategories = Object.keys(categories)
    .filter(key => categories[key] && categories[key].length >= 10) // Mínimo 10 artículos
    .map(key => ({
      slug: key,
      ...categoryConfig[key],
      count: categories[key].length
    }))
    .filter(Boolean)
    .slice(0, 6);

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Explora por Categorías
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/categoria/${category.slug}`}
            className={`group p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ${category.bgColor} border border-gray-200`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full bg-white shadow-sm mb-3 group-hover:shadow-md transition-all duration-300`}>
                <span className="text-3xl">{category.icon}</span>
              </div>
              
              <h3 className={`font-semibold mb-1 ${category.color}`}>
                {category.name}
              </h3>
              
              <p className="text-sm text-gray-600">
                {category.count} artículo{category.count !== 1 ? 's' : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
