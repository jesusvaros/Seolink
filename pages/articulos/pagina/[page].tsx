import React from 'react';
import fs from 'fs';
import path from 'path';
import { GetStaticProps, GetStaticPaths } from 'next';
import { NextSeo } from 'next-seo';
import Layout from '../../../layouts/BaseLayout';
import ArticleCard from '../../../components/ArticleCard';
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

interface PaginatedArticlesPageProps {
  articles: Article[];
  totalArticles: number;
  currentPage: number;
  totalPages: number;
}

const ARTICLES_PER_PAGE = 9;

export const getStaticPaths: GetStaticPaths = async () => {
  // No pre-generamos miles de páginas en build.
  // Con fallback 'blocking', Next generará páginas nuevas bajo demanda
  // (cuando existan nuevos MDX) y las mantendrá actualizadas con ISR.
  return {
    paths: [],
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const currentPage = parseInt(params?.page as string);
  
  // Validar que la página sea un número válido
  if (isNaN(currentPage) || currentPage < 2) {
    return {
      notFound: true
    };
  }
  
  // Leer directorio de posts
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory)
    .filter(filename => filename.endsWith('.mdx'));
  
  // Leer cada archivo para obtener la información
  const allArticles = filenames.map(filename => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Extraer JSON frontmatter
    let frontmatter: Record<string, any> = {}; // Allow 'any' for image object
    if (fileContents.startsWith('---json')) {
      const jsonSection = fileContents.split('---json')[1].split('---')[0];
      try {
        frontmatter = JSON.parse(jsonSection);
      } catch (e) {
        console.error(`Error parsing JSON frontmatter in ${filename}:`, e);
      }
    } 
    // Extraer YAML frontmatter (para archivos antiguos)
    else if (fileContents.startsWith('---')) {
      const yamlSection = fileContents.split('---')[1];
      // Procesamiento básico de YAML
      const frontmatterLines = yamlSection.split('\n').filter(line => line.includes(':'));
      frontmatterLines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          const value = valueParts.join(':').trim();
          // Eliminar comillas si existen
          frontmatter[key.trim()] = value.replace(/^["'](.*)["']$/, '$1');
        }
      });
    }
    
    let finalImage: ImageObject;
    if (typeof frontmatter.image === 'object' && frontmatter.image !== null && 'url' in frontmatter.image) {
      finalImage = frontmatter.image as ImageObject;
    } else if (typeof frontmatter.image === 'string' && frontmatter.image.trim() !== '') {
      finalImage = { url: frontmatter.image, caption: frontmatter.title || 'Imagen del artículo' };
    } else {
      // Fallback placeholder image
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
  
  // Validar que la página solicitada exista
  if (currentPage > totalPages) {
    return {
      notFound: true
    };
  }
  
  // Obtener artículos para la página actual
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const articlesForPage = allArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
  
  return {
    props: {
      articles: articlesForPage,
      totalArticles,
      currentPage,
      totalPages
    },
    // Regenerar la página cada día
    revalidate: 86400
  };
};

const PaginatedArticlesPage: React.FC<PaginatedArticlesPageProps> = ({ 
  articles, 
  totalArticles, 
  currentPage, 
  totalPages 
}) => {
  return (
    <Layout>
      <NextSeo
        title={`Artículos y Guías de Compra - Página ${currentPage} | Comparaland`}
        description={`Explora nuestras guías de compra y recomendaciones de productos - Página ${currentPage} de ${totalPages}.`}
        canonical={`https://comparaland.es/articulos/pagina/${currentPage}`}
        openGraph={{
          url: `https://comparaland.es/articulos/pagina/${currentPage}`,
          title: `Artículos y Guías de Compra - Página ${currentPage} | Comparaland`,
          description: `Explora nuestras guías de compra y recomendaciones de productos - Página ${currentPage} de ${totalPages}.`,
          images: [
            { url: 'https://comparaland.es/images/og-image.jpg', alt: 'Comparaland - Artículos' }
          ],
        }}
      />
      
      {/* Etiquetas rel="prev" y rel="next" para SEO y paginación */}
      <Head>
        {/* Siempre tendrá un prev porque estamos en página 2 o superior */}
        <link 
          rel="prev" 
          href={currentPage === 2 
            ? 'https://comparaland.es/articulos' 
            : `https://comparaland.es/articulos/pagina/${currentPage - 1}`
          } 
        />
        
        {/* Añadir rel="next" si hay más páginas */}
        {currentPage < totalPages && (
          <link rel="next" href={`https://comparaland.es/articulos/pagina/${currentPage + 1}`} />
        )}
      </Head>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Artículos y Guías de Compra</h1>
        <p className="text-gray-600 mb-8">Página {currentPage} de {totalPages}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {articles.map((article) => (
            <ArticleCard
              key={article.slug}
              title={article.title}
              image={article.image}
              slug={article.slug}
              excerpt={article.excerpt}
            />
          ))}
        </div>
        
        {/* Paginación */}
        <div className="flex justify-center items-center space-x-4 my-8">
          {currentPage > 1 && (
            <Link 
              href={currentPage === 2 ? '/articulos' : `/articulos/pagina/${currentPage - 1}`}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800"
            >
              &larr; Anterior
            </Link>
          )}
          
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

export default PaginatedArticlesPage;
