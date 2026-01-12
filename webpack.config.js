// webpack.config.js
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {  mode: "production",
  optimization: {
    usedExports: true,    // Tree-shaking
    minimize: true,
    sideEffects: true
  },  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      openAnalyzer: false,
      reportFilename: "bundle-report.html",
    }),
  ],
};
