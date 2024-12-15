import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";

class Alias extends Model {
  public id!: number;
  public name!: string;
  public password!: string;
}

Alias.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "Alias" }
);

export default Alias;
