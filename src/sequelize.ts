import { Sequelize } from "sequelize";

// Create a Sequelize instance and connect to an SQLite database
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite", // Specify the SQLite database file path
  logging: true, // Optional: disable logging of SQL queries
});

export default sequelize;
