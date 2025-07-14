import fs from 'fs';
import path from 'path';
import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { NextSeo } from 'next-seo';
import Head from 'next/head';
import { extractFrontmatter, preprocessMDX } from '../lib/mdx-utils';
import Link from 'next/link';

import Layout from '../layouts/BaseLayout';
import InternalLink from '../components/InternalLink';
import AffiliateCard from '../components/AffiliateCard';
import ProductTable, { Product } from '../components/ProductTable';
import ProductDetailCard from '../components/ProductDetailCard';
import ProductHeading from '../components/ProductHeading';
import StickyBuyCTA from '../components/StickyBuyCTA';
import ProductRankingTable from '../components/ProductRankingTable';
import RelatedArticles from '../components/RelatedArticles';
import FaqSection from '../components/FaqSection';

interface ImageObject {
  '@type'?: 'ImageObject';
  url: string;
  caption?: string;
}

interface FaqItem {
  question: string;
  answer: string;
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
    updatedAt?: string; // Fecha de actualización opcional
    faq?: FaqItem[];    // Preguntas y respuestas para FAQPage
    comparativa?: string; // Texto comparativo entre productos
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
    const data = frontmatter as { slug?: string } | null;

    // Ensure data exists and has a slug property, or fall back to filename
    const slug = (data && data.slug) ? data.slug : filename.replace(/\.mdx?$/, '');
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

  // Normalize frontMatter.image to ImageObject
  let finalImage: ImageObject;
  const placeholderUrl = '/default-placeholder.jpg'; // Define your actual placeholder image
  const placeholderCaption = 'Imagen no disponible';

  if (typeof data.image === 'string') {
    if (data.image === 'PENDIENTE_URL_IMAGEN_PRODUCTO' || !data.image.startsWith('/') && !data.image.startsWith('http')) {
      finalImage = { url: placeholderUrl, caption: data.title || placeholderCaption };
    } else {
      finalImage = { url: data.image, caption: data.title || placeholderCaption };
    }
  } else if (data.image && typeof data.image === 'object' && 'url' in data.image) {
    const imageUrl = (data.image as ImageObject).url;
    if (imageUrl === 'PENDIENTE_URL_IMAGEN_PRODUCTO' || !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
      finalImage = { url: placeholderUrl, caption: (data.image as ImageObject).caption || data.title || placeholderCaption };
    } else {
      finalImage = data.image as ImageObject;
    }
  } else {
    finalImage = { url: placeholderUrl, caption: placeholderCaption }; // Fallback image
  }

  // Normalize images within data.products
  if (data.products && Array.isArray(data.products)) {
    data.products = data.products.map(product => {
      if (!product) return product; // Should not happen, but good for safety

      let productImage: ImageObject;
      const productCaption = product.name || placeholderCaption;

      if (typeof product.image === 'string') {
        if (product.image === 'PENDIENTE_URL_IMAGEN_PRODUCTO' || (!product.image.startsWith('/') && !product.image.startsWith('http'))) {
          productImage = { url: placeholderUrl, caption: productCaption };
        } else {
          productImage = { url: product.image, caption: productCaption };
        }
      } else if (product.image && typeof product.image === 'object' && 'url' in product.image) {
        const imageUrl = (product.image as ImageObject).url;
        if (imageUrl === 'PENDIENTE_URL_IMAGEN_PRODUCTO' || (!imageUrl.startsWith('/') && !imageUrl.startsWith('http'))) {
          productImage = { url: placeholderUrl, caption: (product.image as ImageObject).caption || productCaption };
        } else {
          productImage = product.image as ImageObject;
        }
      } else {
        // If image is missing or not in a recognized format, use placeholder
        productImage = { url: placeholderUrl, caption: productCaption };
      }
      return { ...product, image: productImage };
    });
  }


  return {
    props: {
      source: mdxSource,
      frontMatter: { ...data, slug, image: finalImage },
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
          images: [{ url: frontMatter.image.url, alt: frontMatter.image.caption || frontMatter.title }],
          type: 'article',
          article: {
            publishedTime: frontMatter.date,
            modifiedTime: frontMatter.updatedAt || frontMatter.date,
            section: frontMatter.category,
            tags:[frontMatter.category],
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
              "image": frontMatter.image.url,
              "inLanguage": "es",
              "articleSection": frontMatter.category || "Guías de compra",
              "keywords": frontMatter.title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, "").split(" ").filter(word => word.length > 3).join(", "),
              "datePublished": (() => {
                // Convert date string to ISO 8601 format with timezone
                try {
                  const date = new Date(frontMatter.date);
                  return date.toISOString(); // Returns format: YYYY-MM-DDTHH:mm:ss.sssZ
                } catch (e) {
                  // Fallback if date parsing fails
                  return new Date().toISOString();
                }
              })(),
              "dateModified": (() => {
                // Use updatedAt if available, otherwise use date
                const dateStr = frontMatter.updatedAt || frontMatter.date;
                try {
                  const date = new Date(dateStr);
                  return date.toISOString(); // Returns format: YYYY-MM-DDTHH:mm:ss.sssZ
                } catch (e) {
                  // Fallback if date parsing fails
                  return new Date().toISOString();
                }
              })(),
              "author": {
                "@type": "Organization",
                "name": "comparaland",
                "url": "https://comparaland.es/nosotros"
              },
              "publisher": {
                "@type": "Organization",
                "name": "comparaland",
                "url": "https://comparaland.es",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://comparaland.es/ogo_no_words.png",
                  "width": 420,
                  "height": 420
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://comparaland.es/${frontMatter.slug}`
              },
              // Añadir FAQ si hay productos o datos FAQ específicos (esto ayuda a obtener rich snippets)
              ...(frontMatter.products && frontMatter.products.length > 0 ? {
                "hasPart": {
                  "@type": "FAQPage",
                  "mainEntity": (() => {
                    // Usar FAQs generadas por IA si están disponibles
                    if (frontMatter.faq && Array.isArray(frontMatter.faq) && frontMatter.faq.length > 0) {
                      return frontMatter.faq.map(item => ({
                        "@type": "Question",
                        "name": item.question,
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": item.answer
                        }
                      }));
                    } 
                    // Fallback a las preguntas estáticas predefinidas
                    const productType = (() => {
                      const title = frontMatter.title.toLowerCase();
                      if (title.includes('mejores')) {
                        const parts = title.split('mejores');
                        return parts.length > 1 && parts[1] ? parts[1].trim() : 'producto';
                      }
                      return 'producto';
                    })();
                    
                    return [
                      {
                        "@type": "Question",
                        "name": `¿Cuál es el mejor ${productType} en ${new Date().getFullYear()}?`,
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": frontMatter.products[0]?.name ? `Según nuestro análisis, ${frontMatter.products[0].name} es actualmente la mejor opción por su relación calidad-precio y prestaciones.` : frontMatter.excerpt
                        }
                      },
                      {
                        "@type": "Question",
                        "name": `¿Qué características debo considerar al comprar ${productType}?`,
                        "acceptedAnswer": {
                          "@type": "Answer",
                          "text": `Debes considerar factores como calidad, precio, funcionalidades específicas y opiniones de otros usuarios. En nuestro artículo analizamos detalladamente estos aspectos para ayudarte a tomar la mejor decisión.`
                        }
                      }
                    ];
                  })()
                },
                // Add ItemList schema for multiple products
                "itemList": {
                  "@type": "ItemList",
                  "name": "Ranking de productos",
                  "itemListElement": frontMatter.products.map((product, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                      "@type": "Product",
                      "additionalType": (() => {
                        // Mapear categorías a tipos de productos en ProductOntology
                        const category = (frontMatter.category || "").toLowerCase();
                        const ontologyMap: Record<string, string> = {
                          "cocina": "http://www.productontology.org/id/Kitchen_utensil",
                          "hogar": "http://www.productontology.org/id/Household_goods",
                          "belleza": "http://www.productontology.org/id/Cosmetics",
                          "moda": "http://www.productontology.org/id/Clothing",
                          "jardin": "http://www.productontology.org/id/Garden_tool",
                          "electronica": "http://www.productontology.org/id/Consumer_electronics",
                          "maquillaje": "http://www.productontology.org/id/Cosmetics",
                          "ropa": "http://www.productontology.org/id/Clothing"
                        };
                        return category in ontologyMap ? ontologyMap[category] : "http://www.productontology.org/id/Consumer_goods";
                      })(),
                      "name": product.name,
                      "image": product.image.url,
                      "itemCondition": "https://schema.org/NewCondition",
                      "category": frontMatter.category || "Cuidado personal",
                      "description": product.description || frontMatter.excerpt,
                      ...(product.asin ? { "sku": product.asin } : {}),
                      "brand": {
                        "@type": "Brand",
                        "name": product.name.split(' ')[0]
                      },
                      "review": {
                        "@type": "Review",
                        "author": { "@type": "Person", "name": "Análisis del Experto" },
                        "datePublished": frontMatter.date ? new Date(frontMatter.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        "reviewRating": { "@type": "Rating", "ratingValue": (() => {
                          // Función hash simple para generar número determinista basado en slug y nombre de producto
                          const getConsistentRating = (seed: string, min: number, max: number) => {
                            let hash = 0;
                            for (let i = 0; i < seed.length; i++) {
                              hash = ((hash << 5) - hash) + seed.charCodeAt(i);
                              hash = hash & hash; // Convertir a entero de 32 bits
                            }
                            // Normalizar entre 0 y 1, luego escalar al rango deseado
                            const normalized = (Math.abs(hash) % 1000) / 1000;
                            return (normalized * (max - min) + min).toFixed(1);
                          };
                          // Usar slug + nombre de producto como semilla
                          const seed = `${frontMatter.slug}-${product.name}-${index}`;
                          return getConsistentRating(seed, 4.4, 5.0);
                        })(), "bestRating": "5" },
                        "reviewBody": product.analisis || `${product.name} es un producto con excelente relación calidad-precio.`
                      },
                      "offers": {
                        "@type": "Offer",
                        "url": product.affiliateLink,
                        "priceCurrency": "EUR",
                        "price": (() => {
                          if (product.price) {
                            if (typeof product.price === 'object' && product.price.schema) {
                              return product.price.schema;
                            } else {
                              const priceStr = String(product.price);
                              const cleaned = priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
                              return cleaned || "0.00"; // Asegurarse de que el precio sea un número válido
                            }
                          }
                          return "";
                        })(),
                        "availability": "https://schema.org/InStock",
                        "priceValidUntil": (() => {
                          // Use the date from the MDX frontmatter as the base date
                          const baseDate = frontMatter.date ? new Date(frontMatter.date) : new Date();
                          const validUntil = new Date(baseDate);
                          validUntil.setFullYear(validUntil.getFullYear() + 1);
                          return validUntil.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                        })(),
                        "shippingDetails": {
                          "@type": "OfferShippingDetails",
                          "shippingRate": {
                            "@type": "MonetaryAmount",
                            "value": "0",
                            "currency": "EUR"
                          },
                          "shippingDestination": {
                            "@type": "DefinedRegion",
                            "addressCountry": "ES"
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
                        "seller": {
                          "@type": "Organization",
                          "name": "Amazon"
                        },
                        "hasMerchantReturnPolicy": {
                          "@type": "MerchantReturnPolicy",
                          "applicableCountry": "ES",
                          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                          "merchantReturnDays": 30,
                          "returnMethod": "https://schema.org/ReturnByMail",
                          "returnFees": "https://schema.org/FreeReturn"
                        }
                      }
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
              {frontMatter.category && (
                <li>
                  <div className="flex items-center">
                    <span className="mx-2">/</span>
                    <Link href={`/categorias/${frontMatter.category}`} className="text-gray-500 hover:text-blue-600">
                      <span className="capitalize">{frontMatter.category}</span>
                    </Link>
                  </div>
                </li>
              )}
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
            FaqSection,
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
