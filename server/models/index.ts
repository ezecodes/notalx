import User from "./User";
import Note from "./Note";
import NoteCollaborator from "./NoteCollaborator";
import NoteHistory from "./NoteHistory";
import Notification from "./Notification";
import Task from "./Task";
import TaskParticipant from "./TaskParticipant";

User.hasMany(Note, { foreignKey: "user_id" });
Note.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Task, { foreignKey: "user_id" });
Task.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(TaskParticipant, { foreignKey: "user_id" });
TaskParticipant.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(NoteHistory, { foreignKey: "updated_by" });
NoteHistory.belongsTo(User, { foreignKey: "updated_by" });

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
  User,
  Note,
  NoteCollaborator,
  Notification,
  Task,
  TaskParticipant,
  NoteHistory,
};
