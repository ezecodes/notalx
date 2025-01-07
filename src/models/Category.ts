import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { ICategory } from "../type";

class Category extends Model<
  Optional<ICategory, "createdAt" | "updatedAt" | "id">
> {}

Category.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Category" }
);

export default Category;
