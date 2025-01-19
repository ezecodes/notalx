const path = require("path");
const { GenerateSW } = require("workbox-webpack-plugin");

module.exports = {
  plugins: [
    // new GenerateSW({
    //   clientsClaim: true,
    //   skipWaiting: true,
    // }),
  ],
  entry: {
    main: "./src/client/main.tsx",
  },
  output: {
    path: path.resolve(__dirname, "public/js"),
    filename: "[name].bundle.js",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      path: require.resolve("path-browserify"),
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    compress: true,
    port: 9000,
    watchFiles: ["src/client/**/*"], // Add this line to specify the path webpack should only watch
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset/resource",
      },
    ],
  },
};
