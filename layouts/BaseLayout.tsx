import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex flex-col justify-between h-screen bg-gray-50">
        <header className="bg-white shadow ">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-3xl font-bold text-yellow-600">
              Amazon Afiliados
            </Link>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 mb-auto">{children}</main>
        <footer className="bg-white py-4 text-center text-gray-500 text-sm mt-8">
          © {new Date().getFullYear()} Amazon Afiliados. No afiliado oficialmente con Amazon.
        </footer>
      </div>
    </>
  );
}
