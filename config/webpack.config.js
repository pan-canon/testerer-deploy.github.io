// config/webpack.config.js

// Import the shared base configuration from the pd_game-config package
const base = require('@pan-canon/pd_game-config/webpack.config.js');

module.exports = {
  // Spread in all settings from the base config:
  // entry, output, module.rules, plugins (incl. CopyWebpackPlugin), optimization, etc.
  ...base,

  // Override the entry point to the project's main script
  entry: { 
    main: './main.js' 
  },

  // Allow switching between production and development modes
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  // In development mode, enable webpack-dev-server
  ...(process.env.NODE_ENV !== 'production' && {
    devServer: {
      static: './dist',  // serve built files from dist/
      open: true,        // open browser automatically
      hot: true          // enable Hot Module Replacement
    }
  })
};