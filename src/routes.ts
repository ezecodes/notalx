import { Router } from "express";
import * as Controller from "./controller";
import {
  authoriseAlias,
  authoriseAliasForNote,
  authoriseAliasToViewNote,
  validateAliasId,
  validateAndSetPagination,
  validateJobId,
  validateNoteId,
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
router.param("job_id", validateJobId);

router
  .route("/alias")
  .get(Controller.getAllAlias)
  .post(Controller.registerAlias);

router.get("/alias/search", Controller.searchAlias);

router.get("/alias/note", authoriseAlias, Controller.getAuthorizedAliasNotes);
router.get("/alias/:alias_id/note", Controller.getAliasNotes);

router
  .route("/note")
  .get(Controller.getAllNotes)
  .post(authoriseAlias, Controller.createNote);

router
  .route("/note/:note_id")
  .delete(authoriseAlias, Controller.deleteNote)
  .put(authoriseAlias, authoriseAliasForNote, Controller.editNote)
  .get(authoriseAliasToViewNote, Controller.getNoteById);

router
  .route("/note/:note_id/job/summerise")
  .post(authoriseAlias, Controller.createNoteSummary);

router.route("/note/:note_id/job/schedule").post(authoriseAlias);
router.route("/note/:note_id/job/draft_email").post(authoriseAlias);

router.route("/note/job/:job_id").get(authoriseAlias, Controller.getSingleJob);
router
  .route("/note/:note_id/job")
  .get(authoriseAlias, validateAndSetPagination, Controller.getAllJobsForNote);

router
  .route("/note/:note_id/collaborators")
  .get(authoriseAlias, Controller.getNoteCollaborators)
  .post(authoriseAlias, authoriseAliasForNote, Controller.addNoteCollaborators)
  .delete(
    authoriseAlias,
    authoriseAliasForNote,
    Controller.deleteNoteCollaborator
  );

export default router;
