import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Layout from '../layouts/BaseLayout';
import ArticleCard from '../components/ArticleCard';
import SearchBar from '../components/SearchBar';
import CategoryGrid from '../components/CategoryGrid';
import SiteStats from '../components/SiteStats';
import TikTokProfile from '../components/TikTokProfile';
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

function getCategoryDisplayName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    'cocina': 'Cocina',
    'belleza': 'Belleza',
    'jardin': 'Jardín',
    'maquillaje': 'Maquillaje',
    'ropa': 'Ropa',
    'hogar': 'Hogar',
    'tecnologia': 'Tecnología',
    'deportes': 'Deportes',
    'salud': 'Salud',
    'moda': 'Moda',
    'mascotas': 'Mascotas',
    'electrodomesticos': 'Electrodomésticos',
    'libros': 'Libros'
  };
  
  return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// Función para obtener datos estáticos
export async function getStaticProps() {
  // Leer datos de categorías
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categoriesObj = JSON.parse(categoriesData);
  
  // Recopilar todos los artículos de todas las categorías
  let allArticles: (Article & { category: string })[] = [];
  Object.keys(categoriesObj).forEach(category => {
    if (Array.isArray(categoriesObj[category])) {
      const articlesWithCategory = categoriesObj[category].map((article: Article) => ({
        ...article,
        category: getCategoryDisplayName(category)
      }));
      allArticles = [...allArticles, ...articlesWithCategory];
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

  // Calcular estadísticas
  const totalArticles = allArticles.length;
  const totalProducts = allArticles.reduce((acc: number, article: Article) => {
    // Usar una función determinista basada en el slug para evitar errores de hidratación
    const hash = article.slug.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    // Estimar 3-5 productos por artículo de forma determinista
    return acc + Math.abs(hash % 3) + 3;
  }, 0);

  return { 
    props: { 
      newestArticles,
      hottestArticles,
      categories: categoriesObj,
      totalArticles,
      totalProducts
    } 
  };
}

interface HomeProps {
  newestArticles: (Article & { category: string })[];
  hottestArticles: (Article & { category: string })[];
  categories: { [key: string]: Article[] };
  totalArticles: number;
  totalProducts: number;
}

export default function Home({ 
  newestArticles, 
  hottestArticles, 
  categories, 
  totalArticles, 
  totalProducts 
}: HomeProps) {
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
      <div className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-16 px-4 mb-12 rounded-2xl" style={{overflow: 'visible'}}>
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-200 rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-blue-200 rounded-full opacity-20"></div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="flex flex-col items-start text-left mb-8 md:mb-0">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 m-0 leading-tight mb-4">
                Lo mejor de lo mejor <br />
                <span className="text-purple-600">en cada compra</span>
              </h1>
              <p className="text-xl text-gray-600 mb-6 max-w-lg">
                Análisis expertos, comparativas detalladas y recomendaciones confiables para que tomes las mejores decisiones.
              </p>
            </div>
            <div className="w-full md:w-auto">
              <img src="/logo.svg" alt="Comparaland" className="h-48 w-auto mx-auto" />
            </div>
          </div>
          
          {/* Buscador */}
          <div className="max-w-2xl mx-auto">
            <SearchBar 
              placeholder="¿Qué producto estás buscando?"
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Categorías */}
      <CategoryGrid categories={categories} />
      
      {/* Estadísticas */}
      <SiteStats totalArticles={totalArticles} totalProducts={totalProducts} />
      
      {/* Newest section */}
      <div id="newest" className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          <span>Lo Más Nuevo</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newestArticles.map((article) => (
            <ArticleCard 
              key={article.slug}
              title={article.title}
              image={article.image}
              slug={article.slug}
              excerpt={article.excerpt}
              category={article.category}
              date={article.date}
            />
          ))}
        </div>
      </div>


      {/* TikTok Profile */}
      <TikTokProfile />
      
      {/* Hottest section */}
      <div id="hottest" className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          <span>Lo Más Popular</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hottestArticles.map((article) => (
            <ArticleCard 
              key={article.slug}
              title={article.title}
              image={article.image}
              slug={article.slug}
              excerpt={article.excerpt}
              category={article.category}
              date={article.date}
            />
          ))}
        </div>
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
