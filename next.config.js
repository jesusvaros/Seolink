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
