import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { INoteCollaborator } from "../type";
import Note from "./Note";
import User from "../user/user.model";

class NoteCollaborator extends Model<
  Optional<INoteCollaborator, "createdAt" | "updatedAt" | "id">
> {
  static async updatePermission(
    this: typeof NoteCollaborator,
    userId: string,
    noteId: string,
    newPermission: "read" | "write"
  ) {
    const validPermissions: ("read" | "write")[] = ["read", "write"];

    if (!validPermissions.includes(newPermission)) {
      throw new Error("Invalid permission");
    }

    const collaborator = await NoteCollaborator.findOne({
      where: { user_id: userId, note_id: noteId },
    });

    if (!collaborator) {
      throw new Error("Collaborator not found");
    }

    if (newPermission === "write") {
      await collaborator.update({ permission: "write" });

      const existingReadPermission = await NoteCollaborator.findOne({
        where: { user_id: userId, note_id: noteId, permission: "read" },
      });

      if (!existingReadPermission) {
        await NoteCollaborator.create({
          user_id: userId,
          note_id: noteId,
          permission: "read",
        });
      }
    } else {
      await collaborator.update({ permission: "read" });
    }
  }
}

NoteCollaborator.init(
  {
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    note_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    permission: {
      type: DataTypes.ENUM("read", "write"),
      allowNull: false,
      defaultValue: "read",
    },
  },
  { sequelize, modelName: "NoteCollaborator" }
);

User.hasMany(NoteCollaborator, { foreignKey: "user_id" });
Note.hasMany(NoteCollaborator, { foreignKey: "note_id" });

export default NoteCollaborator;
