/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using server-side rendering for dynamic CRM routes
  reactStrictMode: true,
  images: {
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
