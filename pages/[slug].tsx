import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from '../layouts/BaseLayout';
import AffiliateCard from '../components/AffiliateCard';
import products from '../data/products.json';
import { NextSeo } from 'next-seo';
import StickyBuyCTA from '../components/StickyBuyCTA';
import Head from 'next/head';
import InternalLink from '../components/InternalLink';
import ProductTable from '../components/ProductTable';

type Product = {
  asin: string;
  name: string;
  image: string;
  affiliateLink: string;
};

type PostProps = {
  source: MDXRemoteSerializeResult;
  frontMatter: {
    title: string;
    date: string;
    image: string;
    excerpt: string;
    products: string[];
    slug: string;
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory);
  
  const paths = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    const slug = data.slug || filename.replace(/\\.mdx?$/, '');
    return {
      params: { slug },
    };
  });
  
  return { paths, fallback: false };

};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory);
  
  // First try to find a file with exact matching slug in frontmatter
  let matchedFile = null;
  for (const filename of filenames) {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    if (data.slug === slug) {
      matchedFile = filename;
      break;
    }
  }
  
  // If no exact match found in frontmatter, try filename match
  if (!matchedFile) {
    matchedFile = filenames.find((fn) => fn.replace(/\.mdx?$/, '') === slug);
  }
  
  if (!matchedFile) {
    return { notFound: true };
  }
  
  const filePath = path.join(postsDirectory, matchedFile);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const mdxSource = await serialize(content);
  
  return {
    props: {
      source: mdxSource,
      frontMatter: { ...data, slug },
    },
  };
};



export default function PostPage({ source, frontMatter }: PostProps) {
  const productCards = (frontMatter.products || []).map((asin) => {
    const product = (products as Product[]).find((p) => p.asin === asin);
    return product ? <AffiliateCard key={asin} product={product} /> : null;
  });

  return (
    <Layout>
      <NextSeo
        title={frontMatter.title}
        description={frontMatter.excerpt}
        canonical={`https://tudominio.com/${frontMatter.slug}`}
        openGraph={{
          url: `https://tudominio.com/${frontMatter.slug}`,
          title: frontMatter.title,
          description: frontMatter.excerpt,
          images: [
            {
              url: frontMatter.image,
              alt: frontMatter.title,
            },
          ],
        }}
      />
      
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: frontMatter.title,
              datePublished: frontMatter.date,
              image: frontMatter.image,
              author: {
                "@type": "Person",
                name: "Tu Nombre o Marca"
              },
              publisher: {
                "@type": "Organization",
                name: "Tu Web",
                logo: {
                  "@type": "ImageObject",
                  url: "https://tudominio.com/logo.png"
                }
              },
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://tudominio.com/${frontMatter.slug}`
              }
            }),
          }}
        />
      </Head>

      <article className="prose prose-neutral dark:prose-invert max-w-3xl mx-auto px-4 sm:px-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold leading-tight">{frontMatter.title}</h1>
          <p className="text-sm text-gray-500">
            Publicado el {new Date(frontMatter.date).toLocaleDateString('es-ES')}
          </p>
          {frontMatter.image && (
            <img
              src={frontMatter.image}
              alt={frontMatter.title}
              className="rounded-lg mt-4 shadow-md w-full h-auto"
              loading="eager"
            />
          )}
        </header>

        {/* Optional Table of Contents could go here */}

        <section className="my-8">
          <MDXRemote {...source} components={{ InternalLink, AffiliateCard, ProductTable}} />
        </section>

        {productCards.length > 0 && (
          <section className="my-12">
            <h2 className="text-2xl font-semibold mb-4">🔍 Productos recomendados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {productCards}
            </div>
          </section>
        )}

        {/* Optional FAQ or related posts section can be added here */}

      </article>

      {/* Mobile-only sticky CTA */}
      {productCards.length > 0 && (
        <StickyBuyCTA product={productCards[0]?.props?.product} />
      )}
    </Layout>
  );
}
