"use strict";

const path = require("path");

module.exports = [
  {
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
    devtool: "source-map",
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
];
