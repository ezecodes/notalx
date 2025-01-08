import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import Alias from "./Alias";
import { ITemplateCategory } from "../type";
import Note from "./Note";
import Template from "./Template";
import Category from "./Category";

class TemplateCategory extends Model<
  Optional<ITemplateCategory, "createdAt" | "updatedAt">
> {}

TemplateCategory.init(
  {
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  { sequelize, modelName: "TemplateCategory" }
);

export default TemplateCategory;
