import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { ErrorCodes, IApiResponse, ICollaborator } from "../type";
import Note from "../note/note.model";
import User from "../user/user.model";

class Collaborator extends Model<
  Optional<ICollaborator, "createdAt" | "updatedAt" | "id">
> {
  static async addCollaborator(
    this: typeof Collaborator,
    userId: string,
    noteId: string,
    permission: "read" | "write"
  ): Promise<IApiResponse<ICollaborator>> {
    if (permission !== "read" && permission !== "write") {
      throw new Error("Invalid permission");
    }

    const existingCollaborator = await Collaborator.findOne({
      where: { user_id: userId, note_id: noteId },
    });

    if (existingCollaborator) {
      return {
        status: "err",
        error_code: ErrorCodes.CONFLICT,
        message: "User is already a collaborator",
      };
    }

    const newCollaborator: ICollaborator = (await Collaborator.create(
      {
        user_id: userId,
        note_id: noteId,
        permission,
      },
      { returning: true, raw: true }
    )) as any;

    return {
      status: "ok",
      data: newCollaborator,
    };
  }
  static async updatePermission(
    this: typeof Collaborator,
    userId: string,
    noteId: string,
    newPermission: "read" | "write"
  ): Promise<IApiResponse<null>> {
    const validPermissions: ("read" | "write")[] = ["read", "write"];

    if (!validPermissions.includes(newPermission)) {
      return {
        status: "err",
        error_code: ErrorCodes.VALIDATION_ERROR,
        message: "Invalid permission",
      };
    }

    const collaborator = await Collaborator.findOne({
      where: { user_id: userId, note_id: noteId },
    });

    if (!collaborator) {
      return {
        status: "err",
        error_code: ErrorCodes.RESOURCE_NOT_FOUND,
        message: "Collaborator not found",
      };
    }
    await collaborator.update({ permission: newPermission });
    return {
      status: "ok",
    };
  }
}

Collaborator.init(
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
  { sequelize, modelName: "Collaborator" }
);

User.hasMany(Collaborator, { foreignKey: "user_id" });
Note.hasMany(Collaborator, { foreignKey: "note_id" });

export default Collaborator;
