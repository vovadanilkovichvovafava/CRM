/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' - dynamic routes require server-side rendering or API routes
  // For static hosting, you need to handle client-side routing properly
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;
