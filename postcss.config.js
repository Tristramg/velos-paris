module.exports = {
  plugins: [
    'tailwindcss',
    ...(process.env.NODE_ENV === 'production'
      ? [
          [
            '@fullhuman/postcss-purgecss',
            {
              content: [
                './pages/**/*.{js,jsx,ts,tsx}',
                './components/**/*.{js,jsx,ts,tsx}',
              ],
              defaultExtractor: (content) =>
                content.match(/[\w-/:]+(?<!:)/g) || [],
              whitelistPatterns: [/mgl-map-wrapper.*/, /mapboxgl.*/],
              whitelist: ['body', 'html'],
            },
          ],
        ]
      : []),
    'postcss-preset-env',
  ],
};
