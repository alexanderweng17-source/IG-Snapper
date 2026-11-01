/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/downloads/chrome": ["./releases/v2.3.4/chrome/IG-Snapper-v2.3.4-customer.zip"],
  },
};
export default nextConfig;
