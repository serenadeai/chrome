"use strict";

const path = require("path");

module.exports = [
  {
    name: "extension",
    target: "web",
    entry: {
      extension: "./src/extension.ts",
      "content-script": "./src/content-script.ts",
      injected: "./src/injected.ts",
      popup: "./src/popup.ts",
    },
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "[name].js",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      symlinks: false,
    },
    devtool: "source-map",
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /\.tsx?$/,
          use: "ts-loader",
        },
      ],
    },
  },
];
