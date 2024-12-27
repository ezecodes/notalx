import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import Alias from "./Alias";
import { INoteCollaborator } from "../type";
import Note from "./Note";

class NoteCollaborator extends Model<
  Optional<INoteCollaborator, "createdAt" | "updatedAt" | "id">
> {}

NoteCollaborator.init(
  {
    alias_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    note_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  { sequelize, modelName: "NoteCollaborator" }
);

NoteCollaborator.hasMany(Alias, { foreignKey: "alias_id" });
NoteCollaborator.hasMany(Note, { foreignKey: "note_id" });

export default NoteCollaborator;
