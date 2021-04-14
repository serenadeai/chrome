"use strict";

const path = require("path");

const config = {
  name: "extension",
  target: "web",
  entry: {
    extension: "./src/extension.ts",
    page: "./src/content/page-command-handler.ts",
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
