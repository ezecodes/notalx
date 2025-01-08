import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { ITemplate, IPagination } from "../type";
import memcachedService from "../memcached";

class Template extends Model<
  Optional<ITemplate, "createdAt" | "updatedAt" | "id">
> {
  static async findByPkWithCache(
    this: typeof Template,
    id: string
  ): Promise<ITemplate | null> {
    const cacheKey = `template:${id}`;
    const cachedTemplate = await memcachedService.get<ITemplate>(cacheKey);

    if (cachedTemplate) {
      return cachedTemplate;
    }

    const template = (await this.findByPk(id, {
      raw: true,
    })) as any;

    if (template) {
      await memcachedService.set(cacheKey, template, 3600);
    }

    return template;
  }

  static async updateByIdWithCache(
    this: typeof Template,
    id: string,
    values: Partial<ITemplate>
  ): Promise<[number, Template[]]> {
    const result = (await this.update(values, {
      where: { id },
    })) as any;

    if (result[0] > 0) {
      const cacheKey = `template:${id}`;
      await memcachedService.delete(cacheKey);
    }

    return result;
  }

  static async destroyByIdWithCache(
    this: typeof Template,
    id: string
  ): Promise<number> {
    const result = await this.destroy({
      where: { id },
    });

    if (result > 0) {
      const cacheKey = `template:${id}`;
      await memcachedService.delete(cacheKey);
    }

    return result;
  }

  static async findAllWithCache(
    this: typeof Template,
    pagination: IPagination
  ): Promise<ITemplate[]> {
    let { page, page_size } = pagination;
    const cacheKey = `templates:page=${page}&limit=${page_size}`;
    const cachedNotes = await memcachedService.get<ITemplate[]>(cacheKey);

    if (cachedNotes) {
      return cachedNotes;
    }

    const offset = (page - 1) * page_size;
    const notes = (await this.findAll({
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

Template.init(
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
      allowNull: true,
    },
    content: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    tags: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Template" }
);

export default Template;
