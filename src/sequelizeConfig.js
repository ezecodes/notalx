const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const dbPath = path.join(__dirname, "..", "./database.sqlite");
module.exports = {
  development: {
    dialect: "sqlite",
    storage: dbPath,
    logging: console.log,
  },
  test: {
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "data", "test-database.sqlite"),
    logging: false,
  },
  production: {
    dialect: "sqlite",
    storage: dbPath,
    logging: false,
  },
};
