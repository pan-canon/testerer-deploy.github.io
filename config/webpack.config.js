// config/webpack.config.js

/**
 * Local Webpack configuration that extends the shared/base config from @pan-canon/pd_game-config.
 *
 * We import the base config (which itself generates triad wrappers and configures triad entry points),
 * then override only what we need:
 *
 * - Instead of including base.entry (which already contains triad entry points), we supply our own
 *   single entry point (“main: './main.js'”). This allows dynamic import(...) calls for triads
 *   to function as lazy-loaded chunks rather than initial entries.
 * - We preserve all other baseConfig properties: output, module.rules, resolve (including triads alias),
 *   plugins, and optimization (including Terser settings).
 * - We explicitly set `mode` and conditionally add `devServer` in development mode.
 */

const path = require('path');
// Import the shared/base configuration from the pd_game-config package
const base = require('@pan-canon/pd_game-config/webpack.config.js');

module.exports = (env, argv) => {
  // Determine if we are in production mode
  const isProd = argv.mode === 'production';

  // Obtain the entire base configuration object (entry, output, module, resolve, plugins, optimization, etc.)
  // by invoking base() with the same env/argv. We pass through env/argv so that base sees the correct mode.
  const baseConfig = base(env, argv);

  return {
    // 1) We override the `entry` entirely to only include our local “main.js”.
    //    We DO NOT spread baseConfig.entry here, because baseConfig.entry already includes
    //    triad entrypoints. If they were included as initial entries, dynamic import(...) of the same
    //    chunk names would fail (“initial chunk cannot be loaded on demand”).
    entry: {
      main: './main.js'
    },

    // 2) Preserve all other settings from the base config (output, module.rules, resolve, plugins, optimization).
    //    In particular, resolve.alias.triads still points to build/triads, and optimization.minimizer
    //    still has TerserPlugin configured to preserve only `webpackChunkName` comments.
    output:       baseConfig.output,
    module:       baseConfig.module,
    resolve:      baseConfig.resolve,
    plugins:      baseConfig.plugins,
    optimization: baseConfig.optimization,

    // 3) Set the mode explicitly (needed in case someone runs `npm run build` without --mode)
    mode: isProd ? 'production' : 'development',

    // 4) In development mode, enable webpack-dev-server
    ...( !isProd && {
      devServer: {
        static: {
          directory: path.resolve(__dirname, '../dist') // serve built files from dist/
        },
        open: true,     // automatically open browser
        hot: true,      // enable Hot Module Replacement
        port: 8080      // local dev server port
      }
    })
  };
};