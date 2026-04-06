/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@quantmind/shared-types'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/terminal',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/terminal/security',
        destination: '/dashboard/settings?tab=security',
        permanent: true,
      },
      {
        source: '/terminal/billing',
        destination: '/dashboard/subscription',
        permanent: true,
      },
      {
        source: '/terminal/risk/:id',
        destination: '/dashboard/analytics', // General analytics for now, can be specific if needed
        permanent: true,
      },
      {
        source: '/terminal/risk',
        destination: '/dashboard/analytics',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
