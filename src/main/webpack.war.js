const merge = require("webpack-merge");
const { WebpackWarPlugin } = require("webpack-war-plugin");
const parent = require("./webpack.config.js");

module.exports = merge(parent, {
  mode: 'production',
  plugins: [
    new WebpackWarPlugin(),
  ],
});

