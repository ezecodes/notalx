import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import sequelize from "../sequelize";
import { INoteHistory, IPagination } from "../type";
import memcachedService from "../memcached";

class NoteHistory extends Model<
  Optional<INoteHistory, "createdAt" | "updatedAt">
> {}

NoteHistory.init(
  {
    note_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    updated_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    changes: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { sequelize, modelName: "NoteHistory" }
);

export default NoteHistory;
