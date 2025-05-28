/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  images: {
    domains: [
      'hips.hearstapps.com',
      'vader-prod.s3.amazonaws.com',
      'www.elle.com',
      'hmg-prod.s3.amazonaws.com',
      'example.com', // Para imágenes de placeholder
      'comparaland.com' // Para futuras imágenes propias
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
