const path = require('path');

module.exports = {
  // The entry point file described above
  entry: './src/index.js',
  // The location of the build folder described above
  output: {
    path: path.resolve(__dirname, 'public/scripts'),
    filename: 'main.js'
  },
  // Optional and for development only. This provides the ability to
  // map the built code back to the original source format when debugging.
  optimization: {
    usedExports: true, // tells webpack to tree-shake
  },
  devtool: 'eval-source-map',
};
