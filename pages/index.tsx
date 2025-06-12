import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Layout from '../layouts/BaseLayout';
import ArticleCard from '../components/ArticleCard';
import { NextSeo } from 'next-seo';
import { useState } from 'react';

// Interfaces para los tipos de datos
interface Article {
  title: string;
  slug: string;
  image: string;
}

interface CategoryData {
  [category: string]: Article[];
}

// Mapeo de IDs de categorías a nombres más amigables
const categoryNames: { [key: string]: string } = {
  cocina: 'Cocina',
  belleza: 'Belleza',
  jardin: 'Jardín',
  maquillaje: 'Maquillaje',
  ropa: 'Ropa'
};

// Función para obtener datos estáticos
export async function getStaticProps() {
  // Leer datos de MDX para información adicional si es necesario
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory).filter((fn: string) => fn.endsWith('.mdx'));
  
  // Leer datos de categorías
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categories: CategoryData = JSON.parse(categoriesData);
  
  // Limitar a 5 artículos por categoría
  const limitedCategories: CategoryData = {};
  Object.keys(categories).forEach(category => {
    if (Array.isArray(categories[category])) {
      limitedCategories[category] = categories[category].slice(0, 5);
    } else {
      limitedCategories[category] = categories[category]; // If not an array, use as is
      console.log(`Warning: Category ${category} is not an array`);
    }
  });
  
  return { 
    props: { 
      categories: limitedCategories 
    } 
  };
}

export default function Home({ categories }: { categories: CategoryData }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Asegurarse de que categories existe y es un objeto
  const safeCategories = categories || {};
  
  // Obtener categorías con artículos
  const categoriesWithArticles = Object.keys(safeCategories).filter(
    category => safeCategories[category]?.length > 0
  );
  
  // Si no hay categoría activa, usar la primera que tenga artículos
  const currentCategory = activeCategory || 
    (categoriesWithArticles.length > 0 ? categoriesWithArticles[0] : null);
  
  return (
    <Layout>
      <NextSeo
        title="Comparaland - Guías de Compra y Análisis de Productos"
        description="Encuentra análisis detallados, comparativas y recomendaciones de los mejores productos. Guías de compra actualizadas por expertos."
        canonical="https://comparaland.es/"
        openGraph={{
          url: 'https://comparaland.es/',
          title: 'Comparaland - Guías de Compra y Análisis de Productos',
          description: 'Encuentra análisis detallados, comparativas y recomendaciones de los mejores productos.',
          images: [{ url: 'https://comparaland.es/images/og-image.jpg', alt: 'Comparaland - Guías de Compra' }],
        }}
      />
      {/* Hero section */}
      <div className="bg-ivory py-12 px-4 mb-8 rounded-xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col items-start text-left mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-4 leading-tight">
              Lo mejor de lo mejor <br />
              en cada compra.
            </h1>
            <a 
              href="#categorias" 
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-300"
            >
              Descubrir Mejores Ofertas
            </a>
          </div>
          <div className="w-full md:w-auto">
            <img src="/logo.svg" alt="Comparaland" className="h-48 w-auto mx-auto" />
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex overflow-x-auto pb-1 hide-scrollbar">
          {categoriesWithArticles.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap mr-2 transition-colors ${currentCategory === category 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              {categoryNames[category] || category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Featured section - mostrar los artículos más recientes destacados */}
      {currentCategory && safeCategories[currentCategory]?.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {categoryNames[currentCategory] || currentCategory}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeCategories[currentCategory].map((article) => (
              <div key={article.slug} className="transform transition-transform hover:translate-y-[-5px]">
                <ArticleCard 
                  title={article.title}
                  image={article.image}
                  slug={article.slug}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Sección para otras categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        {categoriesWithArticles
          .filter(category => category !== currentCategory && safeCategories[category]?.length > 0)
          .slice(0, 2)
          .map(category => (
            <div key={category}>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span>{categoryNames[category] || category}</span>
                <span className="ml-2 text-sm font-normal text-blue-600 cursor-pointer" 
                  onClick={() => setActiveCategory(category)}>
                  Ver todos
                </span>
              </h2>
              <div className="space-y-4">
                {safeCategories[category].slice(0, 2).map(article => (
                  <div key={article.slug} className="flex items-center bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <a href={`/${article.slug}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2">
                        {article.title}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        }
      </div>
      
      {/* Añadir un estilo global para ocultar la barra de desplazamiento */}
      <style jsx global>{
        `
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        `
      }</style>
    </Layout>
  );
}
