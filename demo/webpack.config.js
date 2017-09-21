const path = require('path'); // 导入路径包
const webpack = require('webpack');
const env = process.env.NODE_ENV;

let config = {
  entry: {
    app: ['./src/demo']
  },
  cache: false,
  watch: true,
  output: {
    path: path.resolve(__dirname, '../built'),
    filename: 'app.js'
  },
  devtool: 'inline-source-map',
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  // 使用loader模块
  module: {
    loaders: [{ test: /\.tsx?$/, loader: 'ts-loader' }]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  ],
  devServer: {
    contentBase: path.join(__dirname, '../'),
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    historyApiFallback: {
      index: '/index.html'
    },
    stats: 'minimal',
    host: '0.0.0.0',
    port: 8000,
    inline: true,
    compress: true
  }
};

module.exports = config;
