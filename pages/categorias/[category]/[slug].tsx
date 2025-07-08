import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import fs from 'fs';
import path from 'path';

// Tipo para las propiedades de redirección
type RedirectProps = {
  slug: string;
};

// Componente que redirige a la ruta principal
export default function CategoryRedirect({ slug }: RedirectProps) {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir a la ruta principal
    router.replace(`/${slug}`);
  }, [router, slug]);
  
  // Devolver un componente vacío mientras se realiza la redirección
  return null;
}

// Obtener las propiedades estáticas para la redirección
export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) {
    return { notFound: true };
  }
  
  return {
    props: {
      slug: params.slug,
    }
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
