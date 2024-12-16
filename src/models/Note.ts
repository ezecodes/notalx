import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";
import Alias from "./Alias";

class Note extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public alias_id!: string;
  public hidden!: boolean;
}

Note.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    hidden: { type: DataTypes.BOOLEAN, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.STRING, allowNull: true },
    alias_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Note" }
);

Note.hasMany(Alias, { foreignKey: "alias_id" });

export default Note;
