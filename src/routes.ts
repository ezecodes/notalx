import { Router } from "express";
import * as Controller from "./controller";
import {
  authoriseAlias,
  validateAliasId,
  validateAndSetPagination,
  validateTaskId,
  validateNoteId,
  authorize_alias_as_task_participant,
  authorize_alias_as_task_owner,
  authorize_alias_as_note_owner,
  authorize_alias_as_note_collaborator,
  validateCategoryId,
  validateTemplateId,
  validateRequestBody,
} from "./middlewares";
import { create_category_validator } from "./helpers";

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
router.param("category_id", validateCategoryId);
router.param("template_id", validateTemplateId);

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

router.route("/note/:note_id/category").get(Controller.getNoteCategories);

router
  .route("/task")
  .get(
    authoriseAlias,
    validateAndSetPagination,
    Controller.getAllTasksForAuthorisedAlias
  );

router
  .route("/task/:task_id")
  .get(
    authoriseAlias,
    authorize_alias_as_task_participant,
    Controller.getSingleTask
  )
  .put(
    authoriseAlias,
    authorize_alias_as_task_owner,
    Controller.editTaskSchedule
  );

router
  .route("/task/:task_id/participants")
  .delete(
    authoriseAlias,
    authorize_alias_as_task_owner,
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

router
  .route("/template")
  .post(Controller.createTemplate)
  .get(validateAndSetPagination, Controller.getTemplates);

router
  .route("/template/:template_id")
  .put(Controller.updateTemplate)
  .get(Controller.getTemplate);

router
  .route("/template/:template_id/category/:category_id")
  .delete(Controller.deleteCategoryFromTemplate);

router.route("/use_template").post(authoriseAlias, Controller.useTemplate);

router
  .route("/category")
  .post(
    validateRequestBody(create_category_validator),
    Controller.createCategory
  )
  .get(validateAndSetPagination, Controller.getCategories);
router
  .route("/category/:category_id")
  .put(Controller.updateCategory)
  .get(Controller.getCategory);

export default router;
