/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'apollo-upload-client': require.resolve('apollo-upload-client'),
    };
    return config;
  },
};

module.exports = nextConfig;