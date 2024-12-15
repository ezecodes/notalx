const path = require("path");

module.exports = {
  entry: {
    page: "./src/page.tsx",
  },
  output: {
    path: path.resolve(__dirname, "public/js"), // Place the bundled file in a public folder
    filename: "bundle.js", // Bundle file name
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"], // Resolve TypeScript and JavaScript files
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
  mode: "development", // Can be set to 'production' for optimized builds
};
