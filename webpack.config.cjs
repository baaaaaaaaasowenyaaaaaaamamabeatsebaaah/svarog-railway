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
  const envResult = dotenv.config();

  // Create a properly structured environment variables object
  const envVars = {};

  // If we have an .env file, process its variables
  if (envResult.parsed) {
    Object.keys(envResult.parsed).forEach((key) => {
      envVars[`process.env.${key}`] = JSON.stringify(envResult.parsed[key]);
    });
  }

  // Always set NODE_ENV explicitly
  envVars['process.env.NODE_ENV'] = JSON.stringify(
    isProduction ? 'production' : 'development'
  );

  // Add fallbacks for critical environment variables
  const criticalVars = [
    'STORYBLOK_PUBLIC_TOKEN',
    'STORYBLOK_PREVIEW_TOKEN',
    'STORYBLOK_SPACE_ID',
  ];

  criticalVars.forEach((key) => {
    if (!envVars[`process.env.${key}`]) {
      envVars[`process.env.${key}`] = JSON.stringify('');
      console.warn(`Warning: Environment variable ${key} is not defined`);
    }
  });

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
      // The critical fix: properly define all environment variables
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
      port: process.env.PORT || 8080,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'public'),
      },
    },
    devtool: isProduction ? false : 'source-map',
    performance: {
      hints: false,
    },
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
