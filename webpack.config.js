const path = require("path");

module.exports = {
  entry: {
    index: "./src/client/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "public/js"), // Place the bundled file in a public folder
    filename: "[name].bundle.js", // Bundle file name
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"], // Resolve TypeScript and JavaScript files
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    compress: true,
    port: 9000,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, // Match TypeScript and TSX files
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/, // Match CSS files
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/, // Match image files
        type: "asset/resource",
      },
    ],
  },
};
