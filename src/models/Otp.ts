import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { IOtp } from "../type";

class Otp extends Model<Optional<IOtp, "createdAt" | "updatedAt" | "id">> {}

Otp.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    hash: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: "Otp" }
);

export default Otp;
