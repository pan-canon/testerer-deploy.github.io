/**
 * Local Webpack configuration that extends the shared/base config
 * from @pan-canon/pd_game-config, but overrides only the service-worker
 * plugin to create separate runtime‐cache “subfolders.”
 */

const path = require('path');
const base = require('@pan-canon/pd_game-config/webpack.config.js');
const { GenerateSW } = require('workbox-webpack-plugin');

// Base URL for all assets and navigation fallback
const BASE_PATH = process.env.PUBLIC_URL || '';

module.exports = (env, argv) => {
  const isProd    = argv.mode === 'production';
  const baseConfig = base(env, argv);

  // 1) Remove the default GenerateSW instance from the base plugins
  const filteredPlugins = baseConfig.plugins.filter(
    plugin => plugin.constructor.name !== 'GenerateSW'
  );

  // 2) Add our customized GenerateSW with per‐folder runtime caches
  filteredPlugins.push(
    new GenerateSW({
      swDest: 'sw.js',
      clientsClaim: true,            // Take control of clients as soon as SW activates
      skipWaiting: false,            // Wait for manual SKIP_WAITING
      cleanupOutdatedCaches: true,   // Purge old cache entries
      cacheId: 'game-cache',         // Prefix for precache

      // SPA navigation fallback
      navigateFallback: `${BASE_PATH}/index.html`,
      navigateFallbackDenylist: [
        /\/assets\//,
        /\/triads\//,
        /\/templates\//
      ],

      // Runtime caching rules, each with its own cacheName (“subfolder”)
      runtimeCaching: [
        {
          urlPattern: new RegExp(`${BASE_PATH}/assets/libs/`),
          handler: 'CacheFirst',
          options: { cacheName: 'runtime/cache-libs' }
        },
        {
          urlPattern: new RegExp(`${BASE_PATH}/assets/models/`),
          handler: 'CacheFirst',
          options: { cacheName: 'runtime/cache-models' }
        },
        {
          urlPattern: new RegExp(`${BASE_PATH}/triads/`),
          handler: 'CacheFirst',
          options: { cacheName: 'runtime/cache-triads' }
        },
        {
          urlPattern: /\.(?:png|jpe?g|webp|gif|svg|mp3|wav|ogg|json)$/,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'runtime/cache-statics' }
        },
        {
          urlPattern: /\.js$/,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'runtime/cache-js' }
        },
        {
          urlPattern: new RegExp(`${BASE_PATH}/templates/.*\\.html$`),
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'runtime/cache-templates' }
        }
      ],

      // Allow caching of larger assets (e.g. WASM)
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
    })
  );

  // 3) Return the final config, preserving everything else from baseConfig
  return {
    entry:        { main: './main.js' },
    output:       baseConfig.output,
    module:       baseConfig.module,
    resolve:      baseConfig.resolve,
    plugins:      filteredPlugins,
    optimization: baseConfig.optimization,
    mode:         isProd ? 'production' : 'development',

    // In development, reuse the baseConfig.devServer settings
    ...( !isProd && { devServer: baseConfig.devServer })
  };
};