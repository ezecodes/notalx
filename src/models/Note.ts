import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";

class Note extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
}

Note.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: "Note" }
);

export default Note;
