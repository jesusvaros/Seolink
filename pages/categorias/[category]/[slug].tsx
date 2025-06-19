import fs from 'fs';
import path from 'path';
import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { NextSeo } from 'next-seo';
import Head from 'next/head';
import { extractFrontmatter, preprocessMDX } from '../../../lib/mdx-utils';
import Link from 'next/link';

import Layout from '../../../layouts/BaseLayout';
import InternalLink from '../../../components/InternalLink';
import AffiliateCard from '../../../components/AffiliateCard';
import ProductTable, { Product } from '../../../components/ProductTable';
import ProductDetailCard from '../../../components/ProductDetailCard';
import ProductHeading from '../../../components/ProductHeading';
import StickyBuyCTA from '../../../components/StickyBuyCTA';
import ProductRankingTable from '../../../components/ProductRankingTable';
import RelatedArticles from '../../../components/RelatedArticles';

interface ImageObject {
  '@type'?: 'ImageObject';
  url: string;
  caption?: string;
}

type PostProps = {
  source: MDXRemoteSerializeResult;
  frontMatter: {
    title: string;
    date: string;
    image: ImageObject;
    excerpt: string;
    slug: string;
    category: string;
    products: Product[];
    updatedAt?: string;
    tags?: string[];
  };
  categoryPath: string;
};

interface CategoryData {
  [category: string]: Array<{
    title: string;
    slug: string;
    image: string;
    date: string;
  }>;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  
  // Read categories data
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categories: CategoryData = JSON.parse(categoriesData);
  
  // Create paths for all articles under their categories
  const paths: { params: { category: string, slug: string } }[] = [];
  
  Object.entries(categories).forEach(([category, articles]) => {
    articles.forEach(article => {
      paths.push({
        params: {
          category,
          slug: article.slug
        }
      });
    });
  });
  
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const category = params?.category as string;
  
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory);

  // Verify that the article belongs to the specified category
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categories: CategoryData = JSON.parse(categoriesData);
  
  // Check if the article exists in the specified category
  const categoryArticles = categories[category] || [];
  const articleInCategory = categoryArticles.find(article => article.slug === slug);
  
  if (!articleInCategory) {
    return { notFound: true };
  }

  // Find the article file
  let matchedFile = null;
  for (const filename of filenames) {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');

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

  // Tell serialize not to try parsing frontmatter again
  const mdxSource = await serialize(content, {
    parseFrontmatter: false
  });

  // Normalize frontMatter.image to ImageObject
  let finalImage: ImageObject;
  const placeholderUrl = '/default-placeholder.jpg';
  const placeholderCaption = 'Imagen no disponible';

  if (typeof data.image === 'string') {
    if (data.image === 'PENDIENTE_URL_IMAGEN_PRODUCTO' || !data.image.startsWith('/') && !data.image.startsWith('http')) {
      finalImage = { url: placeholderUrl, caption: placeholderCaption };
    } else {
      finalImage = { url: data.image, caption: data.title || '' };
    }
  } else if (data.image && typeof data.image === 'object') {
    finalImage = data.image;
  } else {
    finalImage = { url: placeholderUrl, caption: placeholderCaption };
  }

  // Ensure products is an array
  const products = Array.isArray(data.products) ? data.products : [];

  return {
    props: {
      source: mdxSource,
      frontMatter: {
        ...data,
        image: finalImage,
        products,
        category: data.category || category, // Use the category from frontmatter or URL
      },
      categoryPath: category
    },
  };
};

export default function CategoryArticlePage({ source, frontMatter, categoryPath }: PostProps) {
  return (
    <Layout>
      <NextSeo
        title={frontMatter.title}
        description={frontMatter.excerpt}
        canonical={`https://comparaland.es/categorias/${categoryPath}/${frontMatter.slug}`}
        openGraph={{
          url: `https://comparaland.es/categorias/${categoryPath}/${frontMatter.slug}`,
          title: frontMatter.title,
          description: frontMatter.excerpt,
          images: [
            {
              url: frontMatter.image.url,
              alt: frontMatter.image.caption || frontMatter.title,
            },
          ],
          type: 'article',
          article: {
            publishedTime: frontMatter.date,
            modifiedTime: frontMatter.updatedAt,
            tags: frontMatter.tags,
          },
        }}
      />

      <Head>
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": frontMatter.title,
              "image": frontMatter.image.url,
              "datePublished": frontMatter.date,
              "dateModified": frontMatter.updatedAt || frontMatter.date,
              "author": {
                "@type": "Organization",
                "name": "Comparaland"
              },
              ...(frontMatter.products && frontMatter.products.length > 0 ? {
                "about": {
                  "@type": "Product",
                  "name": frontMatter.products[0].name,
                  "image": frontMatter.products[0].image,
                  "description": frontMatter.excerpt,
                  "brand": {
                    "@type": "Brand",
                    "name": frontMatter.products[0].brand || "Marca no especificada"
                  },
                  "offers": frontMatter.products.map(product => ({
                    "@type": "Offer",
                    "url": product.url,
                    "price": (() => {
                      if (typeof product.price === 'object' && product.price.schema) {
                        return product.price.schema;
                      } else {
                        const priceStr = String(product.price);
                        return priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
                      }
                    })(),
                    "availability": "https://schema.org/InStock",
                    "shippingDetails": {
                      "@type": "OfferShippingDetails",
                      "shippingRate": {
                        "@type": "MonetaryAmount",
                        "value": "0",
                        "currency": "EUR"
                      },
                      "deliveryTime": {
                        "@type": "ShippingDeliveryTime",
                        "handlingTime": {
                          "@type": "QuantitativeValue",
                          "minValue": 0,
                          "maxValue": 1,
                          "unitCode": "DAY"
                        },
                        "transitTime": {
                          "@type": "QuantitativeValue",
                          "minValue": 1,
                          "maxValue": 3,
                          "unitCode": "DAY"
                        }
                      }
                    },
                    "hasMerchantReturnPolicy": {
                      "@type": "MerchantReturnPolicy",
                      "applicableCountry": "ES",
                      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                      "merchantReturnDays": 30,
                      "returnMethod": "https://schema.org/ReturnByMail",
                      "returnFees": "https://schema.org/FreeReturn"
                    }
                  }))
                }
              } : {})
            }),
          }}
        />
      </Head>

      <article className="prose prose-neutral dark:prose-invert max-w-3xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb navigation */}
        <div className="text-sm text-gray-500 mb-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/" className="inline-flex items-center text-gray-500 hover:text-blue-600">
                  Inicio
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <Link href="/categorias" className="text-gray-500 hover:text-blue-600">
                    Categorías
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <Link href={`/categorias/${categoryPath}`} className="text-gray-500 hover:text-blue-600">
                    <span className="capitalize">{categoryPath}</span>
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-gray-700 truncate max-w-[150px] md:max-w-xs">
                    {frontMatter.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-bold">{frontMatter.title}</h1>
          <p className="text-sm text-gray-500">
            Publicado el {new Date(frontMatter.date).toLocaleDateString('es-ES')}
          </p>
          {frontMatter.image && (
            <img
              src={frontMatter.image.url}
              alt={frontMatter.image.caption || frontMatter.title}
              className="rounded-lg mt-4 shadow-md w-full h-auto"
            />
          )}
        </header>

        {/* Related Articles Section */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10">
          {frontMatter.category && (
            <RelatedArticles
              category={frontMatter.category}
              currentSlug={frontMatter.slug}
              showImage={false}
            />
          )}
        </div>

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
            showImage={true}
          />
        )}
      </div>
    </Layout>
  );
}
