/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript errors ko production build ke waqt ignore karega
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint validation check build phase par completely bypass karega
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;