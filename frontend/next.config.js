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
  async rewrites() {
    return [
      {
        source: '/api/sse-stream/:id',
        destination: 'http://web:8000/sse-stream/:id/', // Note the trailing slash
      },
    ];
  },
};

module.exports = nextConfig;