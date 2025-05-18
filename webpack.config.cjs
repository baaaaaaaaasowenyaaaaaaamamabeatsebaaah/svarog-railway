// webpack.config.cjs
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

module.exports = (env, argv) => {
  // Determine if we're in production mode
  const isProduction = argv.mode === 'production';

  // Load environment variables from .env file
  let envVars = {};
  try {
    const env = dotenv.config().parsed || {};
    envVars = Object.keys(env).reduce((prev, key) => {
      // Don't include NODE_ENV from .env
      if (key !== 'NODE_ENV') {
        prev[`process.env.${key}`] = JSON.stringify(env[key]);
      }
      return prev;
    }, {});
  } catch (error) {
    // .env file not found, that's okay in production
    console.log('No .env file found or error parsing it.');
  }

  // Always define NODE_ENV based on webpack mode
  envVars['process.env.NODE_ENV'] = JSON.stringify(
    isProduction ? 'production' : 'development'
  );

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: '/',
    },
    mode: isProduction ? 'production' : 'development',
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
      // Directly define environment variables instead of using Dotenv plugin
      new webpack.DefinePlugin(envVars),

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

    // Silence performance warnings
    performance: {
      hints: false,
    },

    // Hide all warnings
    stats: {
      warnings: false,
      children: false,
    },

    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },
  };
};
