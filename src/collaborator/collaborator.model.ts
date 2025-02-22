import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import {
  ErrorCodes,
  IApiCollaborator,
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

  static async deleteWithCache(
    this: typeof Collaborator,
    note_id: string,
    user_id: string
  ): Promise<IApiResponse<null>> {
    Collaborator.destroy({ where: { note_id, user_id } });
    const key = `colaborators:${note_id}`;
    await memcachedService.delete(key);
    return {
      status: "ok",
    };
  }

  static async getCollaboratorsForNote(
    this: typeof Collaborator,
    note_id: string
  ): Promise<IApiCollaborator[]> {
    const key = `colaborators:${note_id}`;
    // const cache = null;
    const cache = await memcachedService.get<IApiCollaborator[]>(key);

    if (!cache) {
      const rows: IApiCollaborator[] = (await Collaborator.findAll({
        where: { note_id },
        raw: true,
        include: { model: User, as: "user", attributes: ["name"] },
      })) as any;

      memcachedService.set(key, rows);

      return rows;
    }
    return cache;
  }
  static async addCollaborator(
    this: typeof Collaborator,
    user_id: string,
    note_id: string,
    permission: ICollaboratorPermission
  ): Promise<IApiResponse<null>> {
    console.log(permission);
    if (permission !== "read" && permission !== "write") {
      throw new Error("Invalid permission");
    }
    const key = `colaborators:${note_id}`;

    const values = { user_id, note_id, permission };
    const find = await Collaborator.findOne({ where: { note_id, user_id } });
    await memcachedService.delete(key);

    if (find) {
      await Collaborator.update(
        { permission },
        { where: { user_id, note_id } }
      );
    } else {
      await Collaborator.create(values);
    }

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
      primaryKey: true,
      references: {
        model: User,
        key: "id",
      },
    },
    note_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: Note,
        key: "id",
      },
    },
    permission: {
      type: DataTypes.ENUM("read", "write"),
      allowNull: false,
      defaultValue: "read",
    },
  },
  {
    sequelize,
    modelName: "Collaborator",
    defaultScope: {
      raw: true,
    },
  }
);
User.hasMany(Collaborator, { foreignKey: "user_id", as: "user" });
Collaborator.belongsTo(User, { foreignKey: "user_id", as: "user" });

Note.hasMany(Collaborator, { foreignKey: "note_id" });
Collaborator.belongsTo(Note, { foreignKey: "note_id" });
export default Collaborator;
