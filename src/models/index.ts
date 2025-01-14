import Alias from "./Alias";
import Note from "./Note";
import NoteCollaborator from "./NoteCollaborator";
import NoteHistory from "./NoteHistory";
import Notification from "./Notification";
import Task from "./Task";
import TaskParticipant from "./TaskParticipant";

Alias.hasMany(Note, { foreignKey: "alias_id" });
Note.belongsTo(Alias, { foreignKey: "alias_id" });

Alias.hasMany(Task, { foreignKey: "alias_id" });
Task.belongsTo(Alias, { foreignKey: "alias_id" });

Alias.hasMany(TaskParticipant, { foreignKey: "alias_id" });
TaskParticipant.belongsTo(Alias, { foreignKey: "alias_id" });

Alias.hasMany(Notification, { foreignKey: "alias_id" });
Notification.belongsTo(Alias, { foreignKey: "alias_id" });

Alias.hasMany(NoteHistory, { foreignKey: "updated_by" });
NoteHistory.belongsTo(Alias, { foreignKey: "updated_by" });

Note.hasMany(NoteHistory, { foreignKey: "note_id" });
NoteHistory.belongsTo(Note, { foreignKey: "note_id" });

Note.hasMany(Task, { foreignKey: "note_id" });
Task.belongsTo(Note, { foreignKey: "note_id" });

Note.belongsToMany(NoteCollaborator, {
  through: "NoteCollaboratorMap",
  foreignKey: "note_id",
});
NoteCollaborator.belongsToMany(Note, {
  through: "NoteCollaboratorMap",
  foreignKey: "collaborator_id",
});

Task.hasMany(TaskParticipant, { foreignKey: "task_id" });
TaskParticipant.belongsTo(Task, { foreignKey: "task_id" });

export {
  Alias,
  Note,
  NoteCollaborator,
  Notification,
  Task,
  TaskParticipant,
  NoteHistory,
};
