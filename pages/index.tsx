import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Layout from '../layouts/BaseLayout';
import ArticleCard from '../components/ArticleCard';
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

// Función para obtener datos estáticos
export async function getStaticProps() {
  // Leer datos de categorías
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categoriesObj = JSON.parse(categoriesData);
  
  // Recopilar todos los artículos de todas las categorías
  let allArticles: Article[] = [];
  Object.keys(categoriesObj).forEach(category => {
    if (Array.isArray(categoriesObj[category])) {
      allArticles = [...allArticles, ...categoriesObj[category]];
    }
  });
  
  // Ordenar artículos por fecha para obtener los más nuevos
  const newestArticles = [...allArticles].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }).slice(0, 6); // Mostrar los 6 más recientes
  
  // Generar artículos "hottest" basados en la semana actual
  // Esto asegura que sean los mismos cada semana
  const currentDate = new Date();
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  const weekNumber = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  // Usar el número de semana como semilla para la selección
  const shuffledArticles = [...allArticles];
  
  // Fisher-Yates shuffle con semilla determinista basada en la semana
  const seededRandom = (seed: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  };
  
  for (let i = shuffledArticles.length - 1; i > 0; i--) {
    const j = seededRandom(weekNumber + i, i + 1);
    [shuffledArticles[i], shuffledArticles[j]] = [shuffledArticles[j], shuffledArticles[i]];
  }
  
  const hottestArticles = shuffledArticles.slice(0, 6);
  
  return { 
    props: { 
      newestArticles,
      hottestArticles
    } 
  };
}

export default function Home({ newestArticles, hottestArticles }: { newestArticles: Article[], hottestArticles: Article[] }) {
  
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
      
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Inicio",
                "item": "https://comparaland.es/"
              }
            ]
          })
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
              href="#newest" 
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
      
      {/* Newest section */}
      <div id="newest" className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          <span>Lo Más Nuevo</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newestArticles.map((article) => (
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
      
      {/* Hottest section */}
      <div id="hottest" className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          <span>Lo Más Popular</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hottestArticles.map((article) => (
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
