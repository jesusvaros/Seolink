import fs from 'fs';
import path from 'path';
import { GetStaticProps } from 'next';
import Layout from '../../layouts/BaseLayout';
import ArticleCard from '../../components/ArticleCard';
import { NextSeo } from 'next-seo';
import Link from 'next/link';

// Interfaces para los tipos de datos
interface Article {
  title: string;
  slug: string;
  image: string;
  date: string;
  excerpt?: string;
}

interface CategoryData {
  [category: string]: Article[];
}

// Función para obtener datos estáticos
export const getStaticProps: GetStaticProps = async () => {
  // Leer datos de categorías
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categories: CategoryData = JSON.parse(categoriesData);
  
  // Obtener todas las categorías para la navegación
  const allCategories = Object.keys(categories).filter(cat => 
    Array.isArray(categories[cat]) && categories[cat].length > 0
  );
  
  // Crear un objeto con los primeros 4 artículos de cada categoría
  const categoriesPreview: CategoryData = {};
  allCategories.forEach(cat => {
    categoriesPreview[cat] = categories[cat].slice(0, 4);
  });
  
  return { 
    props: { 
      allCategories,
      categoriesPreview
    } 
  };
};

export default function CategoriesIndexPage({ 
  allCategories,
  categoriesPreview 
}: { 
  allCategories: string[];
  categoriesPreview: CategoryData;
}) {
  return (
    <Layout>
      <NextSeo
        title="Categorías - Comparaland | Guías de Compra y Análisis"
        description="Explora todas las categorías de productos analizados por nuestros expertos. Guías de compra, comparativas y recomendaciones para tomar la mejor decisión."
        canonical="https://comparaland.es/categorias"
        openGraph={{
          url: "https://comparaland.es/categorias",
          title: "Categorías - Comparaland | Guías de Compra y Análisis",
          description: "Explora todas las categorías de productos analizados por nuestros expertos.",
          images: [{ url: 'https://comparaland.es/images/og-image.jpg', alt: "Categorías - Comparaland" }],
        }}
      />
      
      
      {/* Categories Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
          Categorías
        </h1>
        <p className="text-gray-600 mt-2">
          Explora todas nuestras categorías y encuentra los mejores productos analizados por expertos
        </p>
      </div>
      
      {/* Categories Grid */}
      <div className="space-y-12 mb-12">
        {allCategories.map(category => (
          <div key={category} className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                <span className="capitalize">{category}</span>
              </h2>
              <Link 
                href={`/categorias/${category}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Ver todos
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categoriesPreview[category].map((article) => (
                <div key={article.slug} className="transform transition-transform hover:translate-y-[-5px]">
                  <ArticleCard 
                    title={article.title}
                    image={article.image}
                    slug={article.slug}
                    excerpt={article.excerpt}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Añadir un estilo global para ocultar la barra de desplazamiento */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Layout>
  );
}
