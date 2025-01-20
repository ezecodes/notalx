import { NextFunction, Request, Response } from "express";
import {
  ApiError,
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

  res.json({
    status: "ok",
    data: {
      rows: await Collaborator.constructNotesWithCollaborators(
        result.map((i) => i.id)
      ),
      pagination,
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
    owner_id: find!.owner_id,
    id: find!.id,
  };

  res.json({
    status: "ok",
    message: "Note retrieved",
    data: {
      note,
      collaborators: await Collaborator.getCollaboratorsForNote(note.id),
    },
  });
}

export async function getNotesForAuthorizedUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const collaborators: ICollaborator[] = (await Collaborator.findAll({
    where: { user_id: req.__user__!.id },
  })) as any;
  const data = await Collaborator.constructNotesWithCollaborators(
    collaborators.map((i) => i.note_id)
  );

  res.json({
    status: "ok",
    data: {
      rows: data,
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
export async function getNoteCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const rawNotes = await Note.findAll({
    where: { owner_id: req.__user__!.id },
    attributes: ["category_name"],
  });

  // Create a Map to store unique category_name entries
  const uniqueNotesMap = new Map<string, INote>();

  rawNotes.forEach((note) => {
    if (
      note.dataValues.category_name &&
      !uniqueNotesMap.has(note.dataValues.category_name)
    ) {
      uniqueNotesMap.set(note.dataValues.category_name, note.dataValues as any);
    }
  });

  // Convert the Map values to an array
  const get: INote[] = Array.from(uniqueNotesMap.values());

  res.json({
    status: "ok",
    data: { rows: get },
  });
}
