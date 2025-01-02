import { Sequelize } from "sequelize";

// Create a Sequelize instance and connect to an SQLite database
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite", // Specify the SQLite database file path
  logging: true, // Optional: disable logging of SQL queries
});

async function connectDb() {
  try {
    await sequelize.authenticate();
    sequelize.sync({ force: true });
  } catch (err) {
    throw new Error("Database connection failed:" + err);
  }
}

export { connectDb };
export default sequelize;
