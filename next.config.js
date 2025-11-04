/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: [],
  swcMinify: false,
  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60,
    pagesBufferLength: 200,
  },
  experimental: {
    serverMinification: false,
    esmExternals: false,
  },
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
};

module.exports = config;

