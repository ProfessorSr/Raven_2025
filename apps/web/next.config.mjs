/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/__api/:path*',
        destination: process.env.INTERNAL_API_URL || 'http://localhost:4000/:path*',
      },
    ];
  },
};

export default nextConfig;
