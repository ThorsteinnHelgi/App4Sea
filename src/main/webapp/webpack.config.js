module.exports = {
  mode: 'development',
  entry: './scripts/main.js',
  output: {
    filename: 'app4sea_bundle.js',
    path: __dirname + '/dist',
  },
  devtool: 'eval-source-map',
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] }
    ]
  }
};

