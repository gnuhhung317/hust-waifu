/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable in Next.js 15, no need for experimental flag
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checks
  },
  // Enable React 19 features
  experimental: {
    reactCompiler: true, // Optional: Enable React Compiler for better performance
  },
}

module.exports = nextConfig
