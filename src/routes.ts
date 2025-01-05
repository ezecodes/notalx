import { Router } from "express";
import * as Controller from "./controller";
import {
  authoriseAlias,
  validateAliasId,
  validateAndSetPagination,
  validateTaskId,
  validateNoteId,
  authoriseAliasForTask,
  authorize_alias_as_note_owner,
  authorize_alias_as_note_collaborator,
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

router
  .route("/note")
  .post(authoriseAlias, Controller.createNote)
  .get(authoriseAlias, Controller.getAuthorizedAliasNotes);

router
  .route("/note/shared")
  .get(authoriseAlias, Controller.getNotesSharedWithAlias);

router
  .route("/note/:note_id")
  .delete(authoriseAlias, authorize_alias_as_note_owner, Controller.deleteNote)
  .put(
    authoriseAlias,
    authorize_alias_as_note_collaborator,
    Controller.editNote
  )
  .get(
    authoriseAlias,
    authorize_alias_as_note_collaborator,
    Controller.getNoteById
  );

router
  .route("/note/:note_id/summerise")
  .post(authoriseAlias, Controller.createNoteSummary);

router
  .route("/note/:note_id/task")
  .post(
    authoriseAlias,
    authorize_alias_as_note_collaborator,
    Controller.createTaskSchedule
  )
  .get(
    authoriseAlias,
    authorize_alias_as_note_collaborator,
    validateAndSetPagination,
    Controller.getAllTasksForNote
  );

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
  .route("/notification")
  .get(authoriseAlias, validateAndSetPagination, Controller.getNotifications);

router
  .route("/note/:note_id/collaborators")
  .get(
    authoriseAlias,
    authorize_alias_as_note_collaborator,
    Controller.getNoteCollaborators
  )
  .post(
    authoriseAlias,
    authorize_alias_as_note_owner,
    Controller.addNoteCollaborators
  )
  .delete(
    authoriseAlias,
    authorize_alias_as_note_owner,
    Controller.deleteNoteCollaborator
  );

export default router;
