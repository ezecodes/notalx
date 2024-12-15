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
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: "Alias" }
);

export default Alias;
