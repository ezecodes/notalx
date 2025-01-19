import { Router } from "express";
import * as NoteController from "./note.controller";
import { catchAsync } from "../helpers";
import {
  authoriseUser,
  authorize_user_as_note_collaborator,
  authorize_user_as_note_owner,
  validateAndSetPagination,
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

router.get(
  "/note/search",
  authoriseUser,
  validateAndSetPagination,
  NoteController.searchNotes
);

router
  .route("/note/audio")
  .post(authoriseUser, upload.single("file"), NoteController.transcribeAudio);

router
  .route("/note")
  .post(authoriseUser, NoteController.createNote)
  .get(authoriseUser, NoteController.getNotesForAuthorizedUser);
router
  .route("/note/shared")
  .get(authoriseUser, NoteController.getNotesSharedWithUser);

router
  .route("/note/:note_id")
  .delete(
    authoriseUser,
    authorize_user_as_note_owner,
    NoteController.deleteNote
  )
  .put(
    authoriseUser,
    authorize_user_as_note_collaborator,
    NoteController.editNote
  )
  .get(
    authoriseUser,
    authorize_user_as_note_collaborator,
    NoteController.getNoteById
  );

router
  .route("/:note_id/collaborator")
  .get(
    authoriseUser,
    authorize_user_as_note_collaborator,
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
