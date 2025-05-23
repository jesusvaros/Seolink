import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Layout from './layouts/BaseLayout';
import AffiliateCard from '../components/AffiliateCard';
import products from '../data/products.json';
import { NextSeo } from 'next-seo';

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
    return {
      params: { slug: data.slug || filename.replace(/\\.mdx?$/, '') },
    };
  });
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory);
  const filename = filenames.find((fn) => fn.replace(/\\.mdx?$/, '') === slug);
  const filePath = path.join(postsDirectory, filename!);
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
      <NextSeo title={frontMatter.title} description={frontMatter.excerpt} />
      <article className="prose max-w-2xl mx-auto">
        <h1>{frontMatter.title}</h1>
        <p className="text-gray-500 text-sm mb-2">{new Date(frontMatter.date).toLocaleDateString('es-ES')}</p>
        {frontMatter.image && (
          <img src={frontMatter.image} alt={frontMatter.title} className="rounded mb-4" />
        )}
        <MDXRemote {...source} />
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Productos recomendados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productCards}
          </div>
        </div>
      </article>
    </Layout>
  );
}
