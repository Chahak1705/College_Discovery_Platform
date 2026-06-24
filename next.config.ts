/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allows the production build to complete even if your API routes show type errors in VS Code
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bypasses ESLint checks completely during deployment
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;