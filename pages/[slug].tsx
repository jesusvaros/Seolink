import fs from 'fs';
import path from 'path';
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
import ProductDetailCard from '../components/ProductDetailCard';
import ProductHeading from '../components/ProductHeading';
import StickyBuyCTA from '../components/StickyBuyCTA';
import ProductRankingTable from '../components/ProductRankingTable';
import RelatedArticles from '../components/RelatedArticles';

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
              "image": frontMatter.image.url,
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
                },
                // Añadir review para el primer producto
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
                    "image": frontMatter.products[0].image.url,
                    "description": frontMatter.products[0].description || frontMatter.excerpt,
                    "brand": {
                      "@type": "Brand",
                      "name": frontMatter.products[0].name.split(' ')[0] // Extraemos la primera palabra como marca
                    },
                    "offers": {
                      "@type": "Offer",
                      "url": frontMatter.products[0].affiliateLink,
                      "priceCurrency": "EUR",
                      "price": (() => {
                        // Handle both string and object price formats
                        if (frontMatter.products[0].price) {
                          if (typeof frontMatter.products[0].price === 'object' && frontMatter.products[0].price.schema) {
                            // Use the schema format which already has periods
                            return frontMatter.products[0].price.schema;
                          } else {
                            // For string prices, convert commas to periods for schema.org
                            const priceStr = String(frontMatter.products[0].price);
                            return priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
                          }
                        }
                        return "";
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
                    }
                  }
                },
                // Add ItemList schema for multiple products
                "mainEntity": {
                  "@type": "ItemList",
                  "itemListElement": frontMatter.products.map((product, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                      "@type": "Product",
                      "name": product.name,
                      "image": product.image.url,
                      "description": product.description || frontMatter.excerpt,
                      "brand": {
                        "@type": "Brand",
                        "name": product.name.split(' ')[0]
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
                              return priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
                            }
                          }
                          return "";
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
