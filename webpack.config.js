/* eslint @typescript-eslint/no-var-requires: [0] */
/* eslint-env: node */
const path = require('path');

const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  target: 'web',
  entry: './src/index.ts',
  mode: 'production',
  output: {
    publicPath: './',
    path: path.resolve(process.cwd(), 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs',
    clean: true,
    globalObject: 'global',
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),

      algosdk: 'algosdk/dist/cjs/index.js',
      '@zilliqa-js/account': '@zilliqa-js/account/dist/cjs/src/index.js',
      '@zilliqa-js/crypto': '@zilliqa-js/crypto/dist/cjs/src/index.js',
      'bn.js': path.resolve(__dirname, 'node_modules/bn.js'),
      'bignumber.js': path.resolve(__dirname, 'node_modules/bignumber.js'),
      // bip32: path.resolve(__dirname, 'node_modules/bip32'),
      // 'js-sha3': path.resolve(__dirname, 'node_modules/js-sha3'),
    },
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      stream: require.resolve('stream-browserify'),
      zlib: require.resolve('browserify-zlib'),
      events: require.resolve('events'),
      assert: require.resolve('assert'),
      util: require.resolve('util'),

      https: false,
      http: false,
      url: false,
      os: false,
      path: false,
      fs: false,
      net: false,
      tls: false,
    },
  },
  externals: {
    buffer: 'buffer',
    crypto: 'crypto',
  },
  plugins: [
    new BundleAnalyzerPlugin({ theme: 'dark' }),
    new DuplicatePackageCheckerPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.IgnorePlugin({
      checkResource(resource) {
        return /.*\/wordlists\/(?!english).*\.json/.test(resource); // only english
      },
    }),
  ],
  // devtool: 'source-map',
  performance: {
    hints: false,
  },
  optimization: {
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    concatenateModules: true,
    // usedExports: true,
    // sideEffects: false,
    minimize: false,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        parallel: true,
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            passes: 4,
            drop_console: true,
          },
          mangle: {
            reserved: ['BigInteger', 'ECPair', 'Point'],
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      // {
      //   test: /\.json$/,
      //   loader: 'json-loader',
      //   exclude: /node_modules/,
      // },
      {
        test: /\.ts?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
