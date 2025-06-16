import React from 'react';
import fs from 'fs';
import path from 'path';
import { GetStaticProps } from 'next';
import { NextSeo } from 'next-seo';
import Layout from '../../layouts/BaseLayout';
import ArticleCard from '../../components/ArticleCard';
import Link from 'next/link';
import Head from 'next/head';

interface ImageObject {
  '@type'?: 'ImageObject';
  url: string;
  caption?: string;
}

// Interfaces para los tipos de datos
interface Article {
  title: string;
  slug: string;
  image: ImageObject; // Changed from string
  excerpt: string;
  date: string;
  category: string;
}

// Interfaz para el frontmatter
interface Frontmatter {
  slug?: string;
  title?: string;
  image?: ImageObject | string; // Can be object from new MDX or string from old
  excerpt?: string;
  date?: string;
  category?: string;
  [key: string]: any; // Para permitir otras propiedades
}

interface ArticlesPageProps {
  articles: Article[];
  totalArticles: number;
  currentPage: number;
  totalPages: number;
}

const ARTICLES_PER_PAGE = 9;

export const getStaticProps: GetStaticProps = async () => {
  // Leer directorio de posts
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory)
    .filter(filename => filename.endsWith('.mdx'));
  
  // Leer cada archivo para obtener la información
  const allArticles = filenames.map(filename => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Extraer JSON frontmatter
    let frontmatter: Frontmatter = {};
    if (fileContents.startsWith('---json')) {
      const jsonSection = fileContents.split('---json')[1].split('---')[0];
      try {
        frontmatter = JSON.parse(jsonSection);
      } catch (e) {
        console.error(`Error parsing JSON frontmatter in ${filename}:`, e);
      }
    }
    // Initialize frontmatter as an empty object if it's null
    if(frontmatter === null){
      console.log('No frontmatter found in', filename);
      frontmatter = {};
    }
  
    let finalImage: ImageObject;
    if (typeof frontmatter.image === 'object' && frontmatter.image !== null && 'url' in frontmatter.image) {
      finalImage = frontmatter.image as ImageObject;
    } else if (typeof frontmatter.image === 'string' && frontmatter.image.trim() !== '') {
      finalImage = { url: frontmatter.image, caption: frontmatter.title || 'Imagen del artículo' };
    } else {
      finalImage = { url: '/images/placeholder-image.jpg', caption: frontmatter.title || 'Imagen no disponible' };
    }

    return {
      slug: frontmatter.slug || filename.replace(/\.mdx$/, ''),
      title: frontmatter.title || 'Sin título',
      image: finalImage,
      excerpt: frontmatter.excerpt || '',
      date: frontmatter.date || '',
      category: frontmatter.category || ''
    };
  });
  
  // Ordenar por fecha (más reciente primero)
  allArticles.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Dividir en páginas
  const totalArticles = allArticles.length;
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
  const articlesForPage = allArticles.slice(0, ARTICLES_PER_PAGE);
  
  return {
    props: {
      articles: articlesForPage,
      totalArticles,
      currentPage: 1,
      totalPages
    },
    // Regenerar la página cada día
    revalidate: 86400
  };
};

const ArticlesPage: React.FC<ArticlesPageProps> = ({ 
  articles, 
  totalArticles, 
  currentPage, 
  totalPages 
}) => {
  return (
    <Layout>
      <NextSeo
        title="Artículos y Guías de Compra | Comparaland"
        description="Explora nuestras guías de compra y recomendaciones de productos con los análisis más detallados y actualizados."
        canonical="https://comparaland.es/articulos"
        openGraph={{
          url: 'https://comparaland.es/articulos',
          title: 'Artículos y Guías de Compra | Comparaland',
          description: 'Explora nuestras guías de compra y recomendaciones de productos con los análisis más detallados y actualizados.',
          images: [
            { url: 'https://comparaland.es/images/og-image.jpg', alt: 'Comparaland - Artículos' }
          ],
        }}
      />
      
      {/* Etiquetas rel="next" para SEO y paginación */}
      <Head>
        {currentPage < totalPages && (
          <link rel="next" href={`https://comparaland.es/articulos/pagina/${currentPage + 1}`} />
        )}
      </Head>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Artículos y Guías de Compra</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {articles.map((article) => (
            <ArticleCard
              key={article.slug}
              title={article.title}
              image={article.image}
              slug={article.slug}
              excerpt={article.excerpt || ''}
            />
          ))}
        </div>
        
        {/* Paginación */}
        <div className="flex justify-center items-center space-x-4 my-8">          
          <span className="text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          
          {currentPage < totalPages && (
            <Link 
              href={`/articulos/pagina/${currentPage + 1}`}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800"
            >
              Siguiente &rarr;
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ArticlesPage;
