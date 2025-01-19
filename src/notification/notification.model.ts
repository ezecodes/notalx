import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { INotification, IPagination, NotificationType } from "../type";
import memcachedService from "../memcached";

class Notification extends Model<
  Optional<INotification, "createdAt" | "updatedAt" | "id">
> {
  static async findByUser(
    this: typeof Notification,
    user_id: string,
    pagination: IPagination
  ): Promise<INotification[]> {
    // const cacheKey = `notification:${user_id}:all:${pagination.page}:${pagination.page_size}`;

    // const cachedResult = await memcachedService.get<INotification[]>(cacheKey);
    // if (cachedResult) {
    //   return cachedResult;
    // }

    const notifications = (await this.findAll({
      raw: true,
      where: { user_id },
      limit: pagination.page_size,
      offset: (pagination.page - 1) * pagination.page_size,
      order: [["updatedAt", "DESC"]],
    })) as any as INotification[];

    // await memcachedService.set(cacheKey, notifications);

    return notifications;
  }
  static async findByPkWithCache(
    this: typeof Notification,
    id: string
  ): Promise<INotification | null> {
    const cacheKey = `notification:${id}`;
    const cache = await memcachedService.get<INotification>(cacheKey);

    if (cache) {
      return cache;
    }

    const notification = (await this.findByPk(id, {
      raw: true,
    })) as any;

    if (notification) {
      await memcachedService.set(cacheKey, notification, 3600);
    }

    return notification;
  }

  static async updateByIdWithCache(
    this: typeof Notification,
    id: string,
    values: Partial<INotification>
  ): Promise<[number, Notification[]]> {
    const result = (await this.update(values, {
      where: { id },
    })) as any;

    if (result[0] > 0) {
      const cacheKey = `notification:${id}`;
      await memcachedService.delete(cacheKey);
    }

    return result;
  }
}

Notification.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        NotificationType.AddedCollaborator,
        NotificationType.AddedParticipant,
        NotificationType.LoginAlert,
        NotificationType.TaskReminder,
        NotificationType.WelcomeMessage
      ),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Notification" }
);
export default Notification;
