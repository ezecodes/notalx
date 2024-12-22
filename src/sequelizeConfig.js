const path = require("path");

const DATABASE = {
  dialect: "sqlite",
  storage: path.resolve(__dirname, "..", "database.sqlite"),
  logging: false,
};

module.exports = {
  development: {
    ...DATABASE,
    logging: console.log,
  },
  test: {
    ...DATABASE,
    storage: path.resolve(__dirname, "..", "test-database.sqlite"),
  },
  production: {
    ...DATABASE,
    logging: false,
  },
};
