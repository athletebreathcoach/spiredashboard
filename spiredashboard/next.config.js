/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  output: 'export',
  distDir: '.next',
  trailingSlash: true,
  images: {
    domains: [
      'media.giphy.com',
      'media0.giphy.com',
      'media1.giphy.com',
      'media2.giphy.com',
      'media3.giphy.com',
      'media4.giphy.com',
      'i.giphy.com',
      'firebasestorage.googleapis.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media0.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media1.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media2.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media3.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media4.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
  },
}

module.exports = nextConfig 