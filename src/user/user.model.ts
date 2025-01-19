import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { IUser, IPagination } from "../type";
import memcachedService from "../memcached";

class User extends Model<Optional<IUser, "createdAt" | "updatedAt" | "id">> {
  static async findByPkWithCache(
    this: typeof User,
    id: string
  ): Promise<IUser | null> {
    const cacheKey = `User:${id}`;

    const cachedResult = await memcachedService.get<IUser>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const User = (await this.findByPk(id, {
      raw: true,
    })) as any;

    if (User) {
      await memcachedService.set(cacheKey, User);
    }

    return User;
  }

  static async updateByIdWithCache(
    this: typeof User,
    id: string,
    values: Partial<IUser>
  ): Promise<void> {
    memcachedService.delete(`User:${id}`);

    this.update(values, {
      where: { id },
    });
  }

  static async findAllWithCache(
    this: typeof User,
    pagination: IPagination
  ): Promise<IUser[]> {
    const cacheKey = `User:all:${pagination.page}:${pagination.page_size}`;

    const cachedResult = await memcachedService.get<IUser[]>(cacheKey);
    if (cachedResult) {
      console.log("Returning from cache for findAll");
      return cachedResult;
    }

    const users = (await this.findAll({
      attributes: ["id", "name", "email"],
      raw: true,
      limit: pagination.page_size,
      offset: (pagination.page - 1) * pagination.page_size,
    })) as any;

    await memcachedService.set(cacheKey, users);

    return users;
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
