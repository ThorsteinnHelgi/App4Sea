/* eslint-disable quotes */
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: './webapp/scripts/main.js',
  output: {
    filename: 'app4sea_bundle.js',
    path: __dirname + '/dist',
  },
  devtool: 'eval-source-map',
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        loader: 'url-loader',
        options: {
          limit: 8192,
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new CopyWebpackPlugin([
      { from: 'webapp/css', to: 'css/' },
      { from: 'webapp/static', to: 'static/' },
      { from: 'webapp/images', to: 'images/' },
      { from: 'webapp/json', to: 'json/' },
      { from: 'webapp/favicon.ico' },
    ]),
    new HtmlWebpackPlugin({
      template: 'webapp/index.html'
    })
  ],
  node: {
    fs: 'empty',
  },
  devServer: {
    contentBase: __dirname + '/webapp',
    compress: true,
    port: 9000
  }
};
