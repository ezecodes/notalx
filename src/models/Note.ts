import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import sequelize from "../sequelize";
import Alias from "./Alias";
import { INote, IPagination } from "../type";
import memcachedService from "../memcached";
import { NoteAttributes } from "../constants";

class Note extends Model<Optional<INote, "createdAt" | "updatedAt" | "id">> {
  static async findByPkWithCache(
    this: typeof Note,
    id: string
  ): Promise<INote | null> {
    const cacheKey = `note:${id}`;
    const cachedNote = await memcachedService.get<INote>(cacheKey);

    if (cachedNote) {
      return cachedNote;
    }

    const note = (await this.findByPk(id, {
      raw: true,
      attributes: NoteAttributes,
    })) as any;

    if (note) {
      await memcachedService.set(cacheKey, note, 3600);
    }

    return note;
  }

  static async updateByIdWithCache(
    this: typeof Note,
    id: string,
    values: Partial<INote>
  ): Promise<[number, Note[]]> {
    const result = (await this.update(values, {
      where: { id },
    })) as any;

    if (result[0] > 0) {
      const cacheKey = `note:${id}`;
      await memcachedService.delete(cacheKey);
    }

    return result;
  }

  static async destroyByIdWithCache(
    this: typeof Note,
    id: string
  ): Promise<number> {
    const result = await this.destroy({
      where: { id },
    });

    if (result > 0) {
      const cacheKey = `note:${id}`;
      await memcachedService.delete(cacheKey);
    }

    return result;
  }

  static async findAllWithCache(
    this: typeof Note,
    pagination: IPagination
  ): Promise<INote[]> {
    let { page, page_size } = pagination;
    const cacheKey = `notes:page=${page}&limit=${page_size}`;
    const cachedNotes = await memcachedService.get<INote[]>(cacheKey);

    if (cachedNotes) {
      return cachedNotes;
    }

    const offset = (page - 1) * page_size;
    const notes = (await this.findAll({
      attributes: NoteAttributes,
      limit: page_size,
      offset: offset,
      raw: true,
    })) as any;

    if (notes.length > 0) {
      await memcachedService.set(cacheKey, notes, 3600);
    }

    return notes;
  }
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
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Note" }
);

Note.hasMany(Alias, { foreignKey: "alias_id" });

export default Note;
