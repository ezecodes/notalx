import Alias from "./Alias";
import Category from "./Category";
import Note from "./Note";
import NoteCategory from "./NoteCategory";
import NoteCollaborator from "./NoteCollaborator";
import Notification from "./Notification";
import Task from "./Task";
import TaskParticipant from "./TaskParticipant";
import Template from "./Template";
import TemplateCategory from "./TemplateCategory";

Alias.hasMany(Note, { foreignKey: "alias_id" });
Alias.hasMany(Task, { foreignKey: "alias_id" });

Note.hasMany(Task, { foreignKey: "note_id" });

Template.hasMany(TemplateCategory, { foreignKey: "template_id" });
Category.hasMany(TemplateCategory, { foreignKey: "category_id" });

Alias.hasMany(TaskParticipant, { foreignKey: "alias_id" });

Task.hasMany(TaskParticipant, { foreignKey: "task_id" });

Alias.hasMany(Notification, { foreignKey: "alias_id" });

Alias.hasMany(Template, { foreignKey: "alias_id" });

export {
  Alias,
  Category,
  Note,
  NoteCategory,
  NoteCollaborator,
  Notification,
  Task,
  TaskParticipant,
  Template,
  TemplateCategory,
};
