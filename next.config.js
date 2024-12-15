module.exports = {
  basePath: process.env.BASE_PATH,
  output: 'export',
  serverExternalPackages: ['duckdb', 'duckdb-async'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'filer.eco-counter-tools.com',
        port: '',
        pathname: '/file/**',
        search: '',
      },
    ],
  },
};
