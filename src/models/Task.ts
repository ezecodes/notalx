import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { IPagination, ITask } from "../type";
import Note from "./Note";
import memcachedService from "../memcached";
import Alias from "./Alias";

class Task extends Model<Optional<ITask, "createdAt" | "updatedAt" | "id">> {
  static async findByPkWithCache(
    this: typeof Task,
    id: string
  ): Promise<ITask | null> {
    const cacheKey = `task:${id}`;

    const cachedResult = await memcachedService.get<ITask>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const task = (await this.findByPk(id, {
      raw: true,
    })) as any;

    if (task) {
      memcachedService.set(cacheKey, task);
    }

    return task;
  }

  static async updateByIdWithCache(
    this: typeof Task,
    id: string,
    values: Partial<ITask>
  ): Promise<void> {
    memcachedService.delete(`task:${id}`);

    this.update(values, {
      where: { id },
    });
  }

  static async findAllWithCache(
    this: typeof Task,
    pagination: IPagination
  ): Promise<ITask[]> {
    const cacheKey = `task:all:${pagination.page}:${pagination.page_size}`;

    const cachedResult = await memcachedService.get<ITask[]>(cacheKey);
    if (cachedResult) {
      console.log("Returning from cache for findAll");
      return cachedResult;
    }

    const tasks = (await this.findAll({
      attributes: ["id", "name", "email"],
      raw: true,
      limit: pagination.page_size,
      offset: (pagination.page - 1) * pagination.page_size,
    })) as any;

    await memcachedService.set(cacheKey, tasks);

    return tasks;
  }
}

Task.init(
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
    note_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reminder: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    calendar_id: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Task" }
);

Alias.hasMany(Task, { foreignKey: "alias_id" });
Note.hasMany(Task, { foreignKey: "note_id" });

export default Task;
