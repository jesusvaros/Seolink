import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { NextSeo } from 'next-seo';

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Comparaland - Comparativas y análisis de productos</title>
        <meta name="description" content="Encuentra las mejores comparativas y análisis de productos para tomar decisiones de compra informadas." />
      </Head>
      <NextSeo
        additionalMetaTags={[
          {
            property: 'og:image',
            content: 'https://comparaland.es/logo_no_words.png'
          }
        ]}
      />

      <div className="flex flex-col justify-between min-h-screen bg-gray-50">
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex flex-row justify-between items-center">
            <Link href="/" className="flex items-center">
              <div className="relative w-12 md:w-44 h-10 md:h-12">
                <Image 
                  src="/logo_color.png" 
                  alt="Comparaland" 
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </Link>
            <nav className="flex space-x-4 md:space-x-6">
              <Link href="/" className="hidden md:inline-block text-gray-800 hover:text-purple-900 font-medium text-base">Inicio</Link>
              <Link href="/categorias" className="text-gray-800 hover:text-purple-900 font-medium text-sm md:text-base">Categorías</Link>
              <Link href="/articulos" className="text-gray-800 hover:text-purple-900 font-medium text-sm md:text-base">Artículos</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 mb-auto">{children}</main>
        <footer className="bg-white py-6 text-center text-gray-600 text-sm mt-8 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="mb-4">
              <Image src="/logo_no_words.png" alt="Comparaland" width={120} height={40} className="mx-auto mb-4" />
            </div>
            <p>© {new Date().getFullYear()} Comparaland. Todos los derechos reservados.</p>
            <p className="mt-2">Comparativas y análisis independientes de productos.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
