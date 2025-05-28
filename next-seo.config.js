// Default SEO configuration
export default {
  titleTemplate: '%s | comparaland - Análisis de Productos',
  defaultTitle: 'comparaland - Guías de Compra y Análisis de Productos',
  description: 'Encuentra análisis detallados, comparativas y recomendaciones de los mejores productos. Guías de compra actualizadas por expertos.',
  canonical: 'https://comparaland.es/',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://comparaland.es/',
    siteName: 'Comparaland',
    title: 'Comparaland - Guías de Compra y Análisis de Productos',
    description: 'Encuentra análisis detallados, comparativas y recomendaciones de los mejores productos. Guías de compra actualizadas por expertos.',
    images: [
      {
        url: 'https://comparaland.es/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'comparaland - Guías de Compra',
      },
    ],
  },
  twitter: {
    handle: '@comparaland',
    site: '@comparaland',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'theme-color',
      content: '#ffffff',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180'
    },
  ],
};
