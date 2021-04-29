"use strict";

const path = require("path");

const config = {
  name: "extension",
  target: "web",
  entry: {
    extension: "./src/extension.ts",
    inject: "./src/inject.js",
    content: "./src/content/tab.ts",
    page: "./src/page.ts",
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js"
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    symlinks: false
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "ts-loader"
      }
    ]
  }
}

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'source-map';
  }

  return config;
};
