/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@supabase/supabase-js'],
  distDir: process.env.NEXT_DIST_DIR || '.next',
};
export default nextConfig;
