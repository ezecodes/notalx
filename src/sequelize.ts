import { Sequelize } from "sequelize";
import { PG_CONFIG } from "./constants";

const sequelize = new Sequelize(
  PG_CONFIG.database as string,
  PG_CONFIG.username as string,
  PG_CONFIG.password as string,
  {
    define: {
      timestamps: true,
    },
    dialect: "postgres",
    pool: {
      max: 1000,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
  }
);

async function connectDb() {
  try {
    await sequelize.authenticate();
    // sequelize.sync({ force: true });
  } catch (err) {
    throw new Error("Database connection failed:" + err);
  }
}

export { connectDb };
export default sequelize;
