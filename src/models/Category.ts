import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { ICategory, IPagination } from "../type";
import memcachedService from "../memcached";

class Category extends Model<
  Optional<ICategory, "createdAt" | "updatedAt" | "id">
> {
  static async findByPkWithCache(
    this: typeof Category,
    id: string
  ): Promise<ICategory | null> {
    const cacheKey = `category:${id}`;
    const cachedCategory = await memcachedService.get<ICategory>(cacheKey);

    if (cachedCategory) {
      return cachedCategory;
    }

    const category = (await this.findByPk(id, {
      raw: true,
    })) as any;

    if (category) {
      await memcachedService.set(cacheKey, category, 3600);
    }

    return category;
  }

  static async updateByIdWithCache(
    this: typeof Category,
    id: string,
    values: Partial<ICategory>
  ): Promise<[number, Category[]]> {
    const result = (await this.update(values, {
      where: { id },
    })) as any;

    if (result[0] > 0) {
      const cacheKey = `category:${id}`;
      await memcachedService.delete(cacheKey);
    }

    return result;
  }

  static async destroyByIdWithCache(
    this: typeof Category,
    id: string
  ): Promise<number> {
    const result = await this.destroy({
      where: { id },
    });

    if (result > 0) {
      const cacheKey = `category:${id}`;
      await memcachedService.delete(cacheKey);
    }

    return result;
  }

  static async findAllWithCache(
    this: typeof Category,
    pagination: IPagination
  ): Promise<ICategory[]> {
    let { page, page_size } = pagination;
    const cacheKey = `categories:page=${page}&limit=${page_size}`;
    const cachedNotes = await memcachedService.get<ICategory[]>(cacheKey);

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

Category.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reference_category_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Category" }
);

export default Category;
