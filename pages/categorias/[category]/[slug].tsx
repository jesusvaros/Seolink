import { GetStaticPaths, GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';

// Página de redirección generada estáticamente
export default function CategoryRedirect() {
  // Este componente nunca se renderiza porque Next.js maneja la redirección en el lado del servidor
  return null;
}

// Obtener las propiedades estáticas para la redirección
export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) {
    return { notFound: true };
  }

  const slug = params.slug as string;

  return {
    redirect: {
      destination: `/${slug}`,
      permanent: true,
    },
  };
};

// Generar todas las rutas de categorías
export const getStaticPaths: GetStaticPaths = async () => {
  const categoriesPath = path.join(process.cwd(), 'content/categories/categories.json');
  
  // Leer datos de categorías
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categories = JSON.parse(categoriesData);
  
  // Crear rutas para todos los artículos en sus categorías
  const paths: { params: { category: string, slug: string } }[] = [];
  
  Object.entries(categories).forEach(([category, articles]) => {
    if (Array.isArray(articles)) {
      articles.forEach((article: any) => {
        if (article.slug) {
          paths.push({
            params: {
              category,
              slug: article.slug
            }
          });
        }
      });
    }
  });
  
  return { paths, fallback: false };
};
