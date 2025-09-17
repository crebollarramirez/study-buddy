/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable faster refresh
    optimizePackageImports: ['react', 'react-dom'],
  },
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Faster builds
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
