const merge = require("webpack-merge");
const parent = require("./webpack.config.js");

module.exports = merge(parent, {
  mode: 'production',
});

