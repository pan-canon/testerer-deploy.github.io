// webpack.config.js in project root

// Import the shared base configuration from the game-config package
const base = require('@pan-canon/pd_game-config/webpack.config.js');

module.exports = {
  // Spread in all settings from the base config
  ...base,

  // Override the entry point to your main script
  entry: { main: './main.js' },

  // Set mode based on NODE_ENV (production or development)
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  // In development mode, add a devServer section
  ...(process.env.NODE_ENV !== 'production' && {
    devServer: {
      static: './dist',   // Serve files from the "dist" folder
      open: true,         // Open the browser automatically
      hot: true           // Enable Hot Module Replacement
    }
  })
};