import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { INoteCategory, IPagination } from "../type";
import memcachedService from "../memcached";
import Note from "./Note";
import Category from "./Category";

class NoteCategory extends Model<
  Optional<INoteCategory, "createdAt" | "updatedAt">
> {}

NoteCategory.init(
  {
    note_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    alias_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  { sequelize, modelName: "NoteCategory" }
);
Note.belongsToMany(Category, { through: NoteCategory, foreignKey: "note_id" });
Category.belongsToMany(Note, {
  through: NoteCategory,
  foreignKey: "category_id",
});

export default NoteCategory;
