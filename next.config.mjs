/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/downloads/chrome": ["./releases/**/*.zip"],
  },
};
export default nextConfig;
