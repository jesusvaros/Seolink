import fs from 'fs';
import path from 'path';
import { GetStaticProps, GetStaticPaths } from 'next';
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

// Función para obtener rutas estáticas
export const getStaticPaths: GetStaticPaths = async () => {
  // Leer datos de categorías
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categories: CategoryData = JSON.parse(categoriesData);
  
  // Crear paths para todas las categorías
  const paths = Object.keys(categories).map(category => ({
    params: { category }
  }));
  
  return { 
    paths, 
    fallback: false 
  };
};

// Función para obtener datos estáticos
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = params?.category as string;
  
  // Leer datos de categorías
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categories: CategoryData = JSON.parse(categoriesData);
  
  // Obtener todas las categorías para la navegación
  const allCategories = Object.keys(categories).filter(cat => 
    Array.isArray(categories[cat]) && categories[cat].length > 0
  );
  
  // Verificar que la categoría existe
  if (!categories[category] || !Array.isArray(categories[category])) {
    return {
      notFound: true
    };
  }
  
  return { 
    props: { 
      category,
      articles: categories[category],
      allCategories
    } 
  };
};

export default function CategoryPage({ 
  category, 
  articles, 
  allCategories 
}: { 
  category: string; 
  articles: Article[];
  allCategories: string[];
}) {
  // Capitalizar la primera letra de la categoría para mostrarla
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
  
  return (
    <Layout>
      <NextSeo
        title={`${displayCategory} - Comparaland | Guías de Compra y Análisis`}
        description={`Las mejores guías de compra y análisis de productos de ${displayCategory}. Comparativas detalladas y recomendaciones de expertos.`}
        canonical={`https://comparaland.es/categorias/${category}`}
        openGraph={{
          url: `https://comparaland.es/categorias/${category}`,
          title: `${displayCategory} - Comparaland | Guías de Compra y Análisis`,
          description: `Las mejores guías de compra y análisis de productos de ${displayCategory}.`,
          images: [{ url: 'https://comparaland.es/images/og-image.jpg', alt: `${displayCategory} - Comparaland` }],
        }}
      />
      
      {/* Navigation Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex overflow-x-auto pb-1 hide-scrollbar">
          {allCategories.map(cat => (
            <Link
              key={cat}
              href={`/categorias/${cat}`}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap mr-2 transition-colors ${
                cat === category 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="capitalize">{cat}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="capitalize">{category}</span>
        </h1>
      </div>
      
      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {articles.map((article) => (
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
