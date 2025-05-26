import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Layout from '../layouts/BaseLayout';

interface PostMeta {
  slug: string;
  date: string;
  title: string;
  excerpt?: string;
}

export async function getStaticProps() {
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory).filter(fn => fn.endsWith('.mdx'));
  const posts: PostMeta[] = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    return {
      slug: data.slug || filename.replace(/\.mdx?$/, ''),
      date: data.date || '',
      title: data.title || '',
      excerpt: data.excerpt || '',
    };
  });
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { props: { posts } };
}

export default function Home({ posts }: { posts: PostMeta[] }) {
  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Artículos</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.slug} className="p-4 bg-white rounded shadow">
            <Link href={`/${post.slug}`} className="text-2xl font-semibold hover:underline">
              {post.title}
            </Link>
            <p className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString('es-ES')}</p>
            <p className="mt-2 text-gray-700">{post.excerpt}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
