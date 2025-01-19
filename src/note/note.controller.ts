import { NextFunction, Request, Response } from "express";
import {
  ApiError,
  PopulateCollaboratorForNotes,
  PopulateNoteCollaborators,
  QueryLLM1,
  queryVectors,
  validateIncomingNote,
} from "../helpers";
import User from "../user/user.model";
import {
  ErrorCodes,
  ICollaborator,
  IncomingNote,
  INote,
  ISummaryResponse,
} from "../type";
import memcachedService from "../memcached";
import Note from "./note.model";
import Collaborator from "../collaborator/collaborator.model";
import { randomBytes } from "crypto";
import { SUMMARY_PROMPT_VARIATIONS, uploadDir } from "../constants";
import { join } from "path";
import ffmpeg from "fluent-ffmpeg";

export async function searchNotes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const pagination = req.__pagination__!;
  const query = req.query.value as string;

  if (!query) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Enter query"));
    return;
  }

  const result = await queryVectors(query, req.__user__!.id);
  console.log(result);
  if (!result) {
    res.json({
      status: "ok",
      data: {
        rows: [],
        pagination,
      },
    });
    return;
  }
  let notes: INote[] = [];
  for (const i of result) {
    const note = await Note.findByPkWithCache(i.id);
    if (note) notes.push(note);
  }

  res.json({
    status: "ok",
    data: {
      rows: await PopulateCollaboratorForNotes(notes),
      pagination,
    },
  });
}
export async function getNotesSharedWithUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user_id = req.__user__?.id!;

  const findJoins = (await Collaborator.findAll({
    where: { user_id },
    raw: true,
    order: [["updatedAt", "DESC"]],
  })) as any as ICollaborator[];
  if (findJoins.length === 0) {
    res.json({
      status: "ok",
      data: { rows: [], pagination: req.__pagination__! },
    });
    return;
  }

  let notes = (await Promise.all(
    findJoins.map(async (item) => {
      const note = await Note.findByPkWithCache(item.note_id);
      if (!note) return;
      return note;
    })
  )) as any as INote[];
  notes = notes.filter((note) => note);

  res.json({
    status: "ok",
    data: {
      rows: await PopulateCollaboratorForNotes(notes),
      paginaton: req.__pagination__!,
    },
  });
}

export async function deleteNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params["note_id"];

  Note.destroy({ where: { owner_id: req.__user__?.id, id: note_id } });
  res.json({ status: "ok", message: "Note has been deleted " });
}

export async function editNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params["note_id"];
  const note: IncomingNote = req.body;

  const valid = validateIncomingNote(note, "update");
  if (!valid.isValid) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, valid.error));
    return;
  }
  if (!note || Object.keys(note).length === 0) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "The note content cannot be empty. Please provide valid note data."
      )
    );
    return;
  }

  Note.updateByIdWithCache(note_id, valid.data);

  res.json({ status: "ok", message: "Note updated" });
}

export async function transcribeAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const inputPath = req.file!.path; // Temporary path
  const outputPath = join(uploadDir, `${Date.now()}.mp3`);

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("mp3")
        .on("end", resolve) // Resolve when conversion finishes
        .on("error", reject) // Reject on error
        .save(outputPath);
    });

    // const result = await audioTransciption(outputPath);
    // console.log(result);
    // if (!result.success) {
    //   next(
    //     ApiError.error(
    //       ErrorCodes.VALIDATION_ERROR,
    //       "Audio file could not be transcribed"
    //     )
    //   );
    //   return;
    // } else {
    //   unlinkSync(outputPath);
    //   unlinkSync(inputPath);
    // }
    // res.json({
    //   status: "ok",
    //   data: {
    //     words: result.result.words.map((word) => word.word).join(" "),
    //   },
    // });
  } catch (err) {
    console.error(err);
    next(
      ApiError.error(ErrorCodes.VALIDATION_ERROR, "Error while getting audio")
    );

    return;
  } finally {
  }
}
interface ISummarySession extends ISummaryResponse {
  calls_count: number;
}
export async function createNoteSummary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { text, summary_id } = req.body;
  const cacheKey = `summary:${summary_id ?? randomBytes(4).toString("hex")}`;

  if (!text || text.trim() === "" || text.split(" ").length < 10) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "The provided text is either empty or too short to summarize. Please select with at least 10 words."
      )
    );
    return;
  }

  try {
    const cache: ISummarySession | null = await memcachedService.get(cacheKey);
    let prompt =
      cache && cache.calls_count < SUMMARY_PROMPT_VARIATIONS.length
        ? SUMMARY_PROMPT_VARIATIONS[cache.calls_count + 1].prompt
        : SUMMARY_PROMPT_VARIATIONS[0].prompt;

    const summary = await QueryLLM1(text, prompt);
    if (!summary.success) {
      next(
        ApiError.error(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          "Could not complete summary"
        )
      );
      return;
    }

    const data = {
      summary: summary.result.response,
      summary_id: cacheKey.split("summary:")[1],
    };
    const calls_count = cache ? cache.calls_count + 1 : 1;
    memcachedService.set(cacheKey, { ...data, calls_count }, 112); // In 1 mins

    res.json({
      status: "ok",
      message: "Summary completed",
      data,
    });
  } catch (err) {
    console.error(err);
    next(
      ApiError.error(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Could not process request"
      )
    );
  }
}
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
