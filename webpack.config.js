const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

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
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "src/injected.css", to: "injected.css" },
          { from: "src/popup.html", to: "popup.html" },
          { from: "src/popup.css", to: "popup.css" },
        ],
      }),
    ],
  },
];
