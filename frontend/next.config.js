/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'apollo-upload-client': require.resolve('apollo-upload-client'),
    };
    config.resolve.alias.canvas = false;
    config.ignoreWarnings = [
      { module: /node_modules\/react-pdf-js/ },
    ];
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/sse-stream/:id',
        destination: 'http://web:8000/sse-stream/:id/',
      },
      {
        source: '/media/:path*',
        destination: 'http://web:8000/media/:path*',
      },
      {
        source: '/static/:path*',
        destination: 'http://web:8000/static/:path*',
      },
      {
        source: '/graphql/:path*',
        destination: 'http://web:8000/graphql/:path*',
      },
      {
        source: '/api/chatbot/:path*',
        destination: 'http://web:8000/chatbot/:path*',
      },
    ];
  },
};

module.exports = nextConfig;