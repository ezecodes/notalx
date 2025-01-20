import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import {
  ErrorCodes,
  IApiResponse,
  ICollaborator,
  ICollaboratorPermission,
  INote,
} from "../type";
import Note from "../note/note.model";
import User from "../user/user.model";
import memcachedService from "../memcached";

class Collaborator extends Model<
  Optional<ICollaborator, "createdAt" | "updatedAt" | "id">
> {
  static async constructNotesWithCollaborators(
    this: typeof Collaborator,
    note_ids: string[]
  ): Promise<{ note: INote; collaborators: ICollaborator[] }[]> {
    return await Promise.all(
      note_ids.map(async (id) => ({
        note: (await Note.findByPkWithCache(id)) as INote,
        collaborators: await Collaborator.getCollaboratorsForNote(id!),
      }))
    );
  }

  static async getCollaboratorsForNote(
    this: typeof Collaborator,
    note_id: string
  ): Promise<ICollaborator[]> {
    const key = `colaborators:${note_id}`;
    const cache: ICollaborator[] | null = await memcachedService.get(key);

    if (!cache) {
      const rows: ICollaborator[] = (await Collaborator.findAll({
        where: { note_id },
        raw: true,
      })) as any;

      memcachedService.set(key, rows);

      return rows;
    }
    return cache;
  }
  static async addCollaborator(
    this: typeof Collaborator,
    userId: string,
    noteId: string,
    permission: ICollaboratorPermission
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
    newPermission: ICollaboratorPermission
  ): Promise<IApiResponse<null>> {
    const validPermissions: ICollaboratorPermission[] = ["read", "write"];

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
