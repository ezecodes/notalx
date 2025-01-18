import { Router } from "express";
import * as Controller from "./controller";
import {
  authoriseUser,
  validateUserId,
  validateAndSetPagination,
  validateTaskId,
  validateNoteId,
  authorize_user_as_task_participant,
  authorize_user_as_task_owner,
  authorize_user_as_note_owner,
  authorize_user_as_note_collaborator,
  validateRequestBody,
} from "./middlewares";
import { create_category_validator } from "./helpers";
import multer from "multer";
import { join } from "path";
import { uploadDir } from "./constants";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const router = Router();
const otpRouter = Router();

otpRouter.post("/send", Controller.requestOtp);
otpRouter.post("/verify", Controller.verifyOtp);
otpRouter.delete("/invalidate", Controller.invalidateOtp);
otpRouter.get("/expiry", Controller.getOtpExpiration);

router.use("/otp", otpRouter);

router.param("note_id", validateNoteId);
router.param("user_id", validateUserId);
router.param("task_id", validateTaskId);

router.route("/user").get(Controller.getAllUser).post(Controller.registerUser);

router.get(
  "/note/search",
  authoriseUser,
  validateAndSetPagination,
  Controller.searchNotes
);

router
  .route("/note/audio")
  .post(authoriseUser, upload.single("file"), Controller.transcribeAudio);

router
  .route("/note")
  .post(authoriseUser, Controller.createNote)
  .get(authoriseUser, Controller.getAuthorizedUserNotes);

router.route("/note/category").get(authoriseUser, Controller.getNoteCategories);

router
  .route("/note/shared")
  .get(authoriseUser, Controller.getNotesSharedWithUser);

router
  .route("/note/:note_id")
  .delete(authoriseUser, authorize_user_as_note_owner, Controller.deleteNote)
  .put(authoriseUser, authorize_user_as_note_collaborator, Controller.editNote)
  .get(
    authoriseUser,
    authorize_user_as_note_collaborator,
    Controller.getNoteById
  );

router
  .route("/note/:note_id/summerise")
  .post(authoriseUser, Controller.createNoteSummary);

router
  .route("/note/:note_id/task")
  .post(
    authoriseUser,
    authorize_user_as_note_collaborator,
    Controller.createTaskSchedule
  )
  .get(
    authoriseUser,
    authorize_user_as_note_collaborator,
    validateAndSetPagination,
    Controller.getAllTasksForNote
  );

router
  .route("/task")
  .get(
    authoriseUser,
    validateAndSetPagination,
    Controller.getAllTasksForAuthorisedUser
  );

router
  .route("/task/:task_id")
  .get(
    authoriseUser,
    authorize_user_as_task_participant,
    Controller.getSingleTask
  )
  .put(
    authoriseUser,
    authorize_user_as_task_owner,
    Controller.editTaskSchedule
  );

router
  .route("/task/:task_id/participants")
  .delete(
    authoriseUser,
    authorize_user_as_task_owner,
    Controller.deleteTaskParticipant
  );

router
  .route("/notification")
  .get(authoriseUser, validateAndSetPagination, Controller.getNotifications);

router
  .route("/note/:note_id/collaborators")
  .get(
    authoriseUser,
    authorize_user_as_note_collaborator,
    Controller.getNoteCollaborators
  )
  .post(
    authoriseUser,
    authorize_user_as_note_owner,
    Controller.addNoteCollaborators
  )
  .delete(
    authoriseUser,
    authorize_user_as_note_owner,
    Controller.deleteNoteCollaborator
  );

export default router;
