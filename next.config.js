/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to successfully complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
    typescript: {
    ignoreBuildErrors: true, // Add this line to ignore TypeScript errors during build
  },

};

module.exports = nextConfig;
