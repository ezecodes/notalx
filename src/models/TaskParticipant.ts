import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import Alias from "./Alias";
import { ITaskParticipant } from "../type";
import Task from "./Task";

class TaskParticipant extends Model<
  Optional<ITaskParticipant, "createdAt" | "updatedAt" | "id">
> {}

TaskParticipant.init(
  {
    alias_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  { sequelize, modelName: "TaskParticipant" }
);

export default TaskParticipant;
