// webpack.config.cjs
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const mode = isProduction ? 'production' : 'development';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: '/',
    },
    mode,
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },
    plugins: [
      // Use Dotenv to load environment variables
      new Dotenv({
        systemvars: true, // Load all system variables
        defaults: false, // Don't try to load .env.defaults
      }),

      // Define NODE_ENV only once to avoid conflicts
      new webpack.DefinePlugin({
        // Only set NODE_ENV if not already set by Dotenv
        ...(process.env.NODE_ENV
          ? {}
          : { 'process.env.NODE_ENV': JSON.stringify(mode) }),
      }),

      new HtmlWebpackPlugin({
        template: './public/index.html',
        inject: 'body',
      }),

      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: '[name].[contenthash].css',
            }),
          ]
        : []),
    ],
    devServer: {
      port: process.env.PORT || 3000,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'public'),
      },
    },
    devtool: isProduction ? false : 'source-map',
    // Add this to reduce the warning noise in the console
    stats: {
      warningsFilter: [/Failed to parse source map/, /Module not found/],
    },
  };
};
