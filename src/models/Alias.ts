import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { IAlias, IPagination } from "../type";
import memcachedService from "../memcached";
import { AliasAttributes } from "../constants";

class Alias extends Model<Optional<IAlias, "createdAt" | "updatedAt" | "id">> {
  static async findByPkWithCache(
    this: typeof Alias,
    id: string
  ): Promise<IAlias | null> {
    const cacheKey = `alias:${id}`;

    const cachedResult = await memcachedService.get<IAlias>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const alias = (await this.findByPk(id, {
      attributes: AliasAttributes,
      raw: true,
    })) as any;

    if (alias) {
      await memcachedService.set(cacheKey, alias);
    }

    return alias;
  }

  static async updateByIdWithCache(
    this: typeof Alias,
    id: string,
    values: Partial<IAlias>
  ): Promise<void> {
    memcachedService.delete(`alias:${id}`);

    this.update(values, {
      where: { id },
    });
  }

  static async findAllWithCache(
    this: typeof Alias,
    pagination: IPagination
  ): Promise<IAlias[]> {
    const cacheKey = `alias:all:${pagination.page}:${pagination.page_size}`;

    const cachedResult = await memcachedService.get<IAlias[]>(cacheKey);
    if (cachedResult) {
      console.log("Returning from cache for findAll");
      return cachedResult;
    }

    const aliases = (await this.findAll({
      attributes: ["id", "name", "email"],
      raw: true,
      limit: pagination.page_size,
      offset: (pagination.page - 1) * pagination.page_size,
    })) as any;

    await memcachedService.set(cacheKey, aliases);

    return aliases;
  }
}

Alias.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: true },
  },
  { sequelize, modelName: "Alias" }
);

export default Alias;
