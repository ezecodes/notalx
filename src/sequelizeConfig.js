const path = require("path");

module.exports = {
  development: {
    dialect: "sqlite",
    storage:
      process.env.DATABASE_URL ||
      path.resolve(__dirname, "..", "data", "sqlite.db"),
    logging: console.log,
  },
  test: {
    dialect: "sqlite",
    storage: path.resolve(__dirname, "..", "data", "test-database.sqlite"),
    logging: false,
  },
  production: {
    dialect: "sqlite",
    storage: process.env.DATABASE_URL || "/data/sqlite.db", // Use persistent disk path on Render
    logging: false,
  },
};
