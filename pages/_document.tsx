import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="icon" href="/logo_no_words.png" type="image/png" />
        <meta name="theme-color" content="#FFFFF0" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Comparaland",
              "url": "https://comparaland.es",
              "logo": "https://comparaland.es/logo_no_words.png",
              "sameAs": [
                "https://facebook.com/comparaland",
                "https://twitter.com/comparaland",
                "https://instagram.com/comparaland"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+34-000-000-000",
                "contactType": "customer service",
                "availableLanguage": "Spanish"
              }
            })
          }}
        />
        
        {/* Structured Data for WebSite with Search Action */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Comparaland",
              "url": "https://comparaland.es",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://comparaland.es/buscar?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
