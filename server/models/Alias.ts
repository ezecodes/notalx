import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { IUser, IPagination } from "../type";
import memcachedService from "../memcached";
import { UserAttributes } from "../constants";

class User extends Model<Optional<IUser, "createdAt" | "updatedAt" | "id">> {
  static async findByPkWithCache(
    this: typeof User,
    id: string
  ): Promise<IUser | null> {
    const cacheKey = `user:${id}`;

    const cachedResult = await memcachedService.get<IUser>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const user = (await this.findByPk(id, {
      attributes: UserAttributes,
      raw: true,
    })) as any;

    if (user) {
      await memcachedService.set(cacheKey, user);
    }

    return user;
  }

  static async updateByIdWithCache(
    this: typeof User,
    id: string,
    values: Partial<IUser>
  ): Promise<void> {
    memcachedService.delete(`user:${id}`);

    this.update(values, {
      where: { id },
    });
  }

  static async findAllWithCache(
    this: typeof User,
    pagination: IPagination
  ): Promise<IUser[]> {
    const cacheKey = `user:all:${pagination.page}:${pagination.page_size}`;

    const cachedResult = await memcachedService.get<IUser[]>(cacheKey);
    if (cachedResult) {
      console.log("Returning from cache for findAll");
      return cachedResult;
    }

    const useres = (await this.findAll({
      attributes: ["id", "name", "email"],
      raw: true,
      limit: pagination.page_size,
      offset: (pagination.page - 1) * pagination.page_size,
    })) as any;

    await memcachedService.set(cacheKey, useres);

    return useres;
  }
}

User.init(
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
  { sequelize, modelName: "User" }
);

export default User;
