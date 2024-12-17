import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";

class Alias extends Model {
  public id!: number;
  public name!: string;
  public secret!: string;
  public email!: string;
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
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    secret: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: "Alias" }
);

export default Alias;
