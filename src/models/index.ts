import Alias from "./Alias";
import Note from "./Note";
import NoteCollaborator from "./NoteCollaborator";
import Notification from "./Notification";
import Task from "./Task";
import TaskParticipant from "./TaskParticipant";

Alias.hasMany(Note, { foreignKey: "alias_id" });
Alias.hasMany(Task, { foreignKey: "alias_id" });

Note.hasMany(Task, { foreignKey: "note_id" });

Alias.hasMany(TaskParticipant, { foreignKey: "alias_id" });

Task.hasMany(TaskParticipant, { foreignKey: "task_id" });

Alias.hasMany(Notification, { foreignKey: "alias_id" });

// Category.hasOne(Note, { foreignKey: "category_id" });

export { Alias, Note, NoteCollaborator, Notification, Task, TaskParticipant };
