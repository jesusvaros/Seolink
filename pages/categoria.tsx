import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';

// This is a simple redirect page
export default function CategoriasRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/categorias');
  }, [router]);
  
  return (
    <>
      <NextSeo
        title="Categorías - Comparaland | Guías de Compra y Análisis"
        description="Explora todas las categorías de productos analizados por nuestros expertos."
        canonical="https://comparaland.es/categorias"
        noindex={true} // Don't index this redirect page
      />
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Redirigiendo a categorías...</p>
      </div>
    </>
  );
}