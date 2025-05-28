import fs from 'fs';
import path from 'path';
// We no longer need gray-matter as we're parsing JSON directly
import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { NextSeo } from 'next-seo';
import Head from 'next/head';
import { extractFrontmatter, preprocessMDX } from '../lib/mdx-utils';

import Layout from '../layouts/BaseLayout';
import InternalLink from '../components/InternalLink';
import AffiliateCard from '../components/AffiliateCard';
import ProductTable, { Product } from '../components/ProductTable';
import ProductDetailCard, { DetailedProduct } from '../components/ProductDetailCard';
import ProductHeading from '../components/ProductHeading';
import StickyBuyCTA from '../components/StickyBuyCTA';
import ProductRankingTable from '../components/ProductRankingTable';
import RelatedArticles from '../components/RelatedArticles';

type PostProps = {
  source: MDXRemoteSerializeResult;
  frontMatter: {
    title: string;
    date: string;
    image: string;
    excerpt: string;
    slug: string;
    category: string;
    products: Product[];
    updatedAt?: string; // Fecha de actualización opcional
    tags?: string[];    // Etiquetas opcionales
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory);

  const paths = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Use our utility function to handle JSON frontmatter
    const { frontmatter } = extractFrontmatter(fileContents);
    const data = frontmatter as { slug?: string };
    
    const slug = data.slug || filename.replace(/\.mdx?$/, '');
    return { params: { slug } };
  });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory);

  let matchedFile = null;
  for (const filename of filenames) {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Use the utility function for consistent frontmatter handling
    const { frontmatter } = extractFrontmatter(fileContents);
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
      continue;
    }
    const data = frontmatter as { slug?: string };
    
    if (data.slug === slug) {
      matchedFile = filename;
      break;
    }
  }

  if (!matchedFile) {
    matchedFile = filenames.find((fn) => fn.replace(/\.mdx?$/, '') === slug);
  }

  if (!matchedFile) return { notFound: true };

  const filePath = path.join(postsDirectory, matchedFile);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  // Process frontmatter with our utility
  const { frontmatter, content: processedContent } = extractFrontmatter(fileContents);
  const data = frontmatter as { slug?: string, [key: string]: any };
  // Ensure the content is clean from any frontmatter
  const content = preprocessMDX(processedContent);
  
  // Tell serialize not to try parsing frontmatter again and ensure MDX doesn't 
  // try to parse the content as YAML again
  const mdxSource = await serialize(content, {
    parseFrontmatter: false
  });

  return {
    props: {
      source: mdxSource,
      frontMatter: { ...data, slug },
    },
  };
};

export default function PostPage({ source, frontMatter }: PostProps) {
  return (
    <Layout>
      <NextSeo
        title={frontMatter.title}
        description={frontMatter.excerpt}
        canonical={`https://comparaland.es/${frontMatter.slug}`}
        openGraph={{
          url: `https://comparaland.es/${frontMatter.slug}`,
          title: frontMatter.title,
          description: frontMatter.excerpt,
          images: [{ url: frontMatter.image, alt: frontMatter.title }],
          type: 'article',
          article: {
            publishedTime: frontMatter.date,
            modifiedTime: frontMatter.updatedAt || frontMatter.date,
            section: frontMatter.category,
            tags: frontMatter.tags || [frontMatter.category],
          }
        }}
      />

      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": frontMatter.title,
              "description": frontMatter.excerpt,
              "image": frontMatter.image,
              "datePublished": frontMatter.date,
              "dateModified": frontMatter.updatedAt || frontMatter.date,
              "author": {
                "@type": "Organization",
                "name": "comparaland",
                "url": "https://comparaland.es/nosotros"
              },
              "publisher": {
                "@type": "Organization",
                "name": "comparaland",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://comparaland.es/logo.png",
                  "width": 600,
                  "height": 60
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://comparaland.es/${frontMatter.slug}`
              },
              // Añadir FAQ si hay productos (esto ayuda a obtener rich snippets)
              ...(frontMatter.products && frontMatter.products.length > 0 ? {
                "hasPart": {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": `¿Cuál es el mejor ${(() => {
                        // Extraer el tipo de producto del título de forma segura
                        const title = frontMatter.title.toLowerCase();
                        if (title.includes('mejores')) {
                          const parts = title.split('mejores');
                          return parts.length > 1 && parts[1] ? parts[1].trim() : 'producto';
                        }
                        return 'producto';
                      })()} en ${new Date().getFullYear()}?`,
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": frontMatter.products[0]?.name ? `Según nuestro análisis, ${frontMatter.products[0].name} es actualmente la mejor opción por su relación calidad-precio y prestaciones.` : frontMatter.excerpt
                      }
                    },
                    {
                      "@type": "Question",
                      "name": `¿Qué características debo considerar al comprar ${(() => {
                        // Extraer el tipo de producto del título de forma segura
                        const title = frontMatter.title.toLowerCase();
                        if (title.includes('mejores')) {
                          const parts = title.split('mejores');
                          return parts.length > 1 && parts[1] ? parts[1].trim() : 'este producto';
                        }
                        return 'este producto';
                      })()}?`,
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": `Debes considerar factores como calidad, precio, funcionalidades específicas y opiniones de otros usuarios. En nuestro artículo analizamos detalladamente estos aspectos para ayudarte a tomar la mejor decisión.`
                      }
                    }
                  ]
                }
              } : {}),
              // Añadir información de producto si hay productos
              ...(frontMatter.products && frontMatter.products.length > 0 ? {
                "review": {
                  "@type": "Review",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "4.8",
                    "bestRating": "5"
                  },
                  "author": {
                    "@type": "Organization",
                    "name": "comparaland"
                  },
                  "itemReviewed": {
                    "@type": "Product",
                    "name": frontMatter.products[0].name,
                    "image": frontMatter.products[0].image,
                    "description": frontMatter.products[0].description || frontMatter.excerpt,
                    "brand": {
                      "@type": "Brand",
                      "name": frontMatter.products[0].name.split(' ')[0] // Extraemos la primera palabra como marca
                    },
                    "offers": {
                      "@type": "Offer",
                      "url": frontMatter.products[0].affiliateLink,
                      "priceCurrency": "EUR",
                      "price": frontMatter.products[0].price ? frontMatter.products[0].price.replace(/[^0-9,.]/g, '') : "",
                      "availability": "https://schema.org/InStock"
                    }
                  }
                }
              } : {})
            }),
          }}
        />
      </Head>

      <article className="prose prose-neutral dark:prose-invert max-w-3xl mx-auto px-4 sm:px-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{frontMatter.title}</h1>
          <p className="text-sm text-gray-500">
            Publicado el {new Date(frontMatter.date).toLocaleDateString('es-ES')}
          </p>
          {frontMatter.image && (
            <img
              src={frontMatter.image}
              alt={frontMatter.title}
              className="rounded-lg mt-4 shadow-md w-full h-auto"
            />
          )}
        </header>

        <MDXRemote
          {...source}
          components={{
            InternalLink,
            AffiliateCard,
            ProductTable,
            ProductDetailCard,
            ProductHeading,
            ProductRankingTable,
          }}
          scope={{
            products: Array.isArray(frontMatter.products) ? frontMatter.products : [],
          }}
        />

        {/* Sticky Buy CTA for mobile */}
        {frontMatter.products?.length > 0 && (
          <StickyBuyCTA product={frontMatter.products[0]} />
        )}
      </article>
      
      {/* Related Articles Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10">
        {frontMatter.category && (
          <RelatedArticles 
            category={frontMatter.category} 
            currentSlug={frontMatter.slug} 
          />
        )}
      </div>
    </Layout>
  );
}
