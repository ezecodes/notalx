import { Router } from "express";
import * as Controller from "./controller";
import {
  authoriseAlias,
  authoriseAliasForNote,
  authoriseAliasToViewNote,
  validateAliasId,
  validateAndSetPagination,
  validateTaskId,
  validateNoteId,
  authoriseAliasForTask,
} from "./middlewares";

const router = Router();
const otpRouter = Router();

otpRouter.post("/send", Controller.requestOtp);
otpRouter.post("/verify", Controller.verifyOtp);
otpRouter.delete("/invalidate", Controller.invalidateOtp);
otpRouter.get("/expiry", Controller.getOtpExpiration);

router.use("/otp", otpRouter);

router.param("note_id", validateNoteId);
router.param("alias_id", validateAliasId);
router.param("task_id", validateTaskId);

router
  .route("/alias")
  .get(Controller.getAllAlias)
  .post(Controller.registerAlias);

router.get("/alias/search", Controller.searchAlias);

router.get("/alias/note", authoriseAlias, Controller.getAuthorizedAliasNotes);

router
  .route("/note")
  .get(validateAndSetPagination, Controller.getAllNotes)
  .post(authoriseAlias, Controller.createNote);

router
  .route("/note/:note_id")
  .delete(authoriseAlias, Controller.deleteNote)
  .put(authoriseAlias, authoriseAliasForNote, Controller.editNote)
  .get(authoriseAliasToViewNote, Controller.getNoteById);

router
  .route("/note/:note_id/summerise")
  .post(authoriseAlias, Controller.createNoteSummary);

router
  .route("/note/:note_id/task")
  .post(authoriseAlias, authoriseAliasForNote, Controller.createTaskSchedule)
  .get(authoriseAlias, validateAndSetPagination, Controller.getAllTasksForNote);

router.route("/note/:note_id/draft_email").post(authoriseAlias);

router
  .route("/task")
  .get(
    authoriseAlias,
    validateAndSetPagination,
    Controller.getAllTasksForAuthorisedAlias
  );

router
  .route("/task/:task_id")
  .get(authoriseAlias, authoriseAliasForTask, Controller.getSingleTask)
  .put(authoriseAlias, authoriseAliasForTask, Controller.editTaskSchedule);

router
  .route("/task/:task_id/participants")
  .delete(
    authoriseAlias,
    authoriseAliasForTask,
    Controller.deleteTaskParticipant
  );

router
  .route("/note/:note_id/collaborators")
  .get(authoriseAlias, authoriseAliasForNote, Controller.getNoteCollaborators)
  .post(authoriseAlias, authoriseAliasForNote, Controller.addNoteCollaborators)
  .delete(
    authoriseAlias,
    authoriseAliasForNote,
    Controller.deleteNoteCollaborator
  );

export default router;
