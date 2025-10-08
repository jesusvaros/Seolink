import { DocumentTextIcon, ShoppingBagIcon, StarIcon, UsersIcon } from '@heroicons/react/24/outline';

interface SiteStatsProps {
  totalArticles: number;
  totalProducts: number;
}

export default function SiteStats({ totalArticles, totalProducts }: SiteStatsProps) {
  const stats = [
    {
      name: 'Artículos Publicados',
      value: totalArticles.toLocaleString('es-ES'),
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Productos Analizados',
      value: totalProducts.toLocaleString('es-ES'),
      icon: ShoppingBagIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Reseñas Expertas',
      value: '500+',
      icon: StarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Usuarios Satisfechos',
      value: '10K+',
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="mb-12">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Comparaland en Números
          </h2>
          <p className="text-gray-600">
            Ayudando a miles de personas a tomar mejores decisiones de compra
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            
            return (
              <div key={stat.name} className="text-center">
                <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-3`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
                
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                
                <div className="text-sm text-gray-600">
                  {stat.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
