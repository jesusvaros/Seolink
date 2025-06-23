import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';

// This is a catch-all redirect page for /categoria/* to /categorias/*
export default function CategoriaRedirect() {
  const router = useRouter();
  const { slug } = router.query;
  
  useEffect(() => {
    if (slug && Array.isArray(slug)) {
      // Redirect to the same path but with 'categorias' instead of 'categoria'
      router.replace(`/categorias/${slug.join('/')}`);
    }
  }, [router, slug]);
  
  // Construct the target URL for redirection
  const targetPath = slug && Array.isArray(slug) ? `/categorias/${slug.join('/')}` : '/categorias';
  const targetUrl = `https://comparaland.es${targetPath}`;
  
  return (
    <>
      <NextSeo
        title="Redirigiendo - Comparaland"
        description="Redirigiendo a la página correcta"
        canonical={targetUrl}
        noindex={true} // Don't index this redirect page
      />
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </>
  );
}
