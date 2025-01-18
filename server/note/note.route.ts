import { Router } from "express";
import * as NoteController from "./note.controller";
import { catchAsync } from "../helpers";
import {
  authoriseUser,
  authorize_user_as_note_collaborator,
  authorize_user_as_note_owner,
} from "../middlewares";
import * as CollaboratorController from "../collaborator/collaborator.controller";

const router = Router();

router.post("/", catchAsync(NoteController.createNote));
router.get("/", catchAsync(NoteController.getNotesForAuthorizedUser));

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

export default router;
