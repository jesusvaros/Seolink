import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow mb-8">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-yellow-600">
              Amazon Afiliados
            </Link>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4">{children}</main>
        <footer className="bg-white mt-12 py-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Amazon Afiliados. No afiliado oficialmente con Amazon.
        </footer>
      </div>
    </>
  );
}
