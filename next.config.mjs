/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/downloads/chrome": ["./releases/v2.3.3/chrome/IG-Snapper-v2.3.3-customer.zip"],
  },
};
export default nextConfig;
