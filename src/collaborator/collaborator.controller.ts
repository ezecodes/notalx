import { NextFunction, Request, Response } from "express";
import Note from "../note/note.model";
import { ApiError, fanOutNotification } from "../helpers";
import { ErrorCodes, NotificationType } from "../type";
import Collaborator from "./collaborator.model";
import User from "../user/user.model";

export async function getNoteCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params.note_id;

  res.json({
    status: "ok",
    data: {
      rows: await Collaborator.getCollaboratorsForNote(note_id),
    },
  });
}

export async function addNoteCollaborator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { user_id, note_id, permission } = req.body;

  const update = await Collaborator.addCollaborator(
    user_id,
    note_id,
    permission
  );
  if (update.status === "err") {
    next(ApiError.error(update.error_code!, update.message!));
    return;
  }

  const user = await User.findByPkWithCache(user_id);
  const note = await Note.findByPkWithCache(note_id);

  fanOutNotification(
    NotificationType.AddedCollaborator,
    {
      title: "You've Been Added as a Collaborator!",
      message: `<a href="">${
        user?.name
      }</a> added you as a collaborator to note: <strong>${note?.title!}</strong>`,
      metadata: {
        note_id,
      },
    },
    [user_id]
  );

  res.json({
    status: "ok",
    message: "Collaborators added successfully",
  });
}

export async function deleteNoteCollaborator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { note_id, user_id } = req.body;

  const find = await Note.findByPkWithCache(note_id);

  if (find && find.owner_id === user_id) {
    next(
      ApiError.error(ErrorCodes.FORBIDDEN, "You cannot delete the note owner")
    );
    return;
  }

  Collaborator.destroy({ where: { note_id, user_id } });
  res.json({
    status: "ok",
    message: "Collaborator deleted",
  });
}
