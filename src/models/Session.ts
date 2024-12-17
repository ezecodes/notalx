import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { ISession } from "../type";

class Session extends Model<
  Optional<ISession, "createdAt" | "updatedAt" | "id">
> {}

Session.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_agent: { type: DataTypes.STRING, allowNull: false },
    ip_address: { type: DataTypes.STRING, allowNull: false },
    expiry: { type: DataTypes.DATE, allowNull: false },
    alias_id: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, modelName: "Session" }
);

export default Session;
