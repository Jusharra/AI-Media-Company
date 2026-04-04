/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET,
    DB_DIR: process.env.DB_DIR || './data',
    ADMIN_SITE_URL: process.env.ADMIN_SITE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
