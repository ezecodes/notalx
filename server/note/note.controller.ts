import { NextFunction, Request, Response } from "express";
import {
  ApiError,
  PopulateCollaboratorForNotes,
  PopulateNoteCollaborators,
} from "../helpers";
import User from "../user/user.model";
import { ErrorCodes, INote } from "../type";
import memcachedService from "../memcached";
import Note from "./note.model";
import Collaborator from "../collaborator/collaborator.model";

export async function getNoteById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params.note_id;

  const find = await Note.findByPkWithCache(note_id!);

  const note = {
    title: find!.title,
    content: find!.content,
    createdAt: find!.createdAt,
    self_destroy_time: find!.self_destroy_time,
    user_id: find!.owner_id,
    id: find!.id,
  };

  res.json({
    status: "ok",
    message: "Note retrieved",
    data: {
      note,
      collaborators: await PopulateNoteCollaborators(note.id!),
    },
  });
}

export async function getNotesForAuthorizedUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const owner_id = req.__user__?.id!;

  let notes = (await Note.findAll({
    where: {
      owner_id,
    },
    raw: true,
    order: [["updatedAt", "DESC"]],
  })) as any as INote[];

  res.json({
    status: "ok",
    data: {
      rows: await PopulateCollaboratorForNotes(notes),
    },
  });
}
export async function createNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const findUser = await User.findByPkWithCache(req.__user__?.id!);

  if (!findUser) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Account not found"));
    return;
  }

  memcachedService.delete("last_pagination");

  const note: INote = (await Note.create(
    { owner_id: req.__user__!.id!, title: "Untitled", content: "" },
    { returning: true, raw: true }
  )) as any;

  Collaborator.create({
    note_id: note.id,
    permission: "write",
    user_id: req.__user__!.id,
  });

  res.json({ status: "ok", data: note });
}
