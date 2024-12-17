import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import Alias from "./Alias";
import { INote } from "../type";

class Note extends Model<Optional<INote, "createdAt" | "updatedAt" | "id">> {}

Note.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    alias_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    slug: { type: DataTypes.STRING, unique: true, allowNull: false },
    content: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    is_hidden: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    will_self_destroy: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    secret: { type: DataTypes.STRING, allowNull: true },
    self_destroy_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Note" }
);

Note.hasMany(Alias, { foreignKey: "alias_id" });

export default Note;
