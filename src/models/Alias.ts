import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { IAlias } from "../type";

class Alias extends Model<Optional<IAlias, "createdAt" | "updatedAt" | "id">> {}

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
    email: { type: DataTypes.STRING, unique: true, allowNull: true },
  },
  { sequelize, modelName: "Alias" }
);

export default Alias;
