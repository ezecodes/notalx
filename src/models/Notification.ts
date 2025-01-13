import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import Alias from "./Alias";
import { INotification, IPagination, NotificationType } from "../type";
import memcachedService from "../memcached";

class Notification extends Model<
  Optional<INotification, "createdAt" | "updatedAt" | "id">
> {
  static async findByAlias(
    this: typeof Notification,
    alias_id: string,
    pagination: IPagination
  ): Promise<INotification[]> {
    // const cacheKey = `notification:${alias_id}:all:${pagination.page}:${pagination.page_size}`;

    // const cachedResult = await memcachedService.get<INotification[]>(cacheKey);
    // if (cachedResult) {
    //   return cachedResult;
    // }

    const notifications = (await this.findAll({
      raw: true,
      where: { alias_id },
      limit: pagination.page_size,
      offset: (pagination.page - 1) * pagination.page_size,
      order: [["updatedAt", "DESC"]],
    })) as any as INotification[];

    // await memcachedService.set(cacheKey, notifications);

    return notifications;
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
    alias_id: {
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
