import { Router } from "express";
import * as NoteController from "./note.controller";
import {
  authoriseUser,
  authorize_user_as_note_collaborator,
  authorize_user_as_note_owner,
  validateAndSetPagination,
  validateNoteId,
} from "../middlewares";
import * as CollaboratorController from "../collaborator/collaborator.controller";
import multer from "multer";
import { uploadDir } from "../constants";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const router = Router();

router.param("note_id", validateNoteId);

router.get(
  "/search",
  authoriseUser,
  validateAndSetPagination,
  NoteController.searchNotes
);

router
  .route("/audio")
  .post(authoriseUser, upload.single("file"), NoteController.transcribeAudio);

router
  .route("/")
  .post(authoriseUser, NoteController.createNote)
  .get(authoriseUser, NoteController.getNotesForAuthorizedUser);

router
  .route("/:note_id")
  .delete(
    authoriseUser,
    authorize_user_as_note_owner,
    NoteController.deleteNote
  )
  .put(
    authoriseUser,
    authorize_user_as_note_collaborator("write"),
    NoteController.editNote
  )
  .get(
    authoriseUser,
    authorize_user_as_note_collaborator("read"),
    NoteController.getNoteById
  );

router
  .route("/:note_id/collaborator")
  .get(
    authoriseUser,
    authorize_user_as_note_collaborator("read"),
    CollaboratorController.getNoteCollaborators
  )
  .post(
    authoriseUser,
    authorize_user_as_note_owner,
    CollaboratorController.addNoteCollaborator
  )
  .delete(
    authoriseUser,
    authorize_user_as_note_owner,
    CollaboratorController.deleteNoteCollaborator
  );
router
  .route("/:note_id/summerise")
  .post(authoriseUser, NoteController.createNoteSummary);

export default router;
