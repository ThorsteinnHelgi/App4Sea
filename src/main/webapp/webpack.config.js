module.exports = {
  mode: 'development',
  entry: './scripts/main.js',
  output: {
    path: __dirname + '/dist',
    filename: 'app4sea_bundle.js'
  },
  devtool: 'eval-source-map',
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  }
};

