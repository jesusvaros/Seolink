/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  async redirects() {
    return [
      {
        source: '/categorias/:category/:slug',
        destination: '/:slug',
        permanent: true, // Redirección 301 permanente
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hips.hearstapps.com',
      },
      {
        protocol: 'https',
        hostname: 'vader-prod.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'www.elle.com',
      },
      {
        protocol: 'https',
        hostname: 'hmg-prod.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com', // Para imágenes de placeholder
      },
      {
        protocol: 'https',
        hostname: 'comparaland.com', // Para futuras imágenes propias
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-eu.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'amazon.es',
      },
      {
        protocol: 'https',
        hostname: 'amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'media.amazon.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'www.compramejor.es',
      },
    ],
  },
  // Exclude specific pages from the build process
  webpack: (config, { isServer }) => {
    // Fix for the build errors
    if (isServer) {
      // Exclude problematic routes from the build
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        return entries;
      };
    }
    return config;
  },
};

module.exports = nextConfig;
