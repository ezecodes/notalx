import { CookieOptions, NextFunction, Request, Response } from "express";
import Alias from "./models/Alias";
import { validate } from "uuid";
import {
  ApiError,
  generateSlug,
  getChatCompletions,
  getRandomInt,
  getSessionFromReq,
  isExpired,
  isValidEmail,
  parseLiteralTime,
  PopulateCollaboratorForNotes,
  PopulateNoteCollaborators,
  PopulateParticipantForTasks,
  PopulateTaskParticipants,
  sendEmail,
  setExpiryInUTC,
  validateIncomingNote,
  validateUsername,
} from "./helpers";
import {
  _IAlias,
  ErrorCodes,
  IAlias,
  IAuthSession,
  IncomingNote,
  INote,
  IOtpSession,
  ITask,
} from "./type";
import {
  NoteAttributes,
  CacheKeys,
  otpSessionCookieKey,
  sessionCookieKey,
} from "./constants";
import memcachedService from "./memcached";
import { randomBytes } from "crypto";
import { compare, hashSync } from "bcrypt";
import Note from "./models/Note";
import { Op } from "sequelize";
import NoteCollaborator from "./models/NoteCollaborator";
import { isDate } from "util/types";
import Task from "./models/Task";
import TaskParticipant from "./models/TaskParticipant";

("----- getAllAlias ------");
export async function getAllAlias(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const all = await Alias.findAll({ where: {}, attributes: ["id", "name"] });
  res.json({ status: "ok", data: { rows: all } });
}

("----- requestOtp ------");
export async function requestOtp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { alias_id } = req.body;

  if (!alias_id || !validate(alias_id)) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Alias not found"));

    return;
  }

  const user = (await Alias.findByPk(alias_id, { raw: true })) as any as IAlias;

  if (!user) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Alias not found"));

    return;
  }
  const code = getRandomInt().toString();
  const auth_code_hash = hashSync(code, 10);
  console.log(code);

  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 30);

  const otpSessionSlug = randomBytes(20).toString("base64url");

  const cookieOpts: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1440 * 60 * 1000, // 60 minutes
    signed: true,
  };

  const cache: IOtpSession = {
    alias_id,
    expiry,
    auth_code_hash,
  };
  memcachedService.set(CacheKeys.otp(otpSessionSlug), cache, 3600);

  console.log(user);
  sendEmail({
    html: `Your code ${code}`,
    receiver: user.email,
    subject: "Your OTP",
  });
  res.cookie(otpSessionCookieKey, otpSessionSlug, cookieOpts);

  res.json({ status: "ok", message: "OTP sent to email" });
}

("----- verifyOtp ------");
export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { alias_id, code } = req.body;
  if (!alias_id || !validate(alias_id) || !code) {
    next(
      ApiError.error(
        ErrorCodes.RESOURCE_NOT_FOUND,
        "Please ensure that both alias ID and OTP code are provided in the request"
      )
    );
    return;
  }
  const sessionSlug = req.signedCookies[otpSessionCookieKey];

  if (!sessionSlug) {
    next(
      ApiError.error(ErrorCodes.UNAUTHORIZED, "OTP session expired or invalid")
    );
    return;
  }
  const cachedSession: IOtpSession | null = await memcachedService.get(
    CacheKeys.otp(sessionSlug)
  );
  if (!cachedSession) {
    next(
      ApiError.error(ErrorCodes.UNAUTHORIZED, "OTP session expired or invalid")
    );
    return;
  }

  const valid = await compare(code.toString(), cachedSession.auth_code_hash);
  if (alias_id !== cachedSession.alias_id || !valid) {
    next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Invalid Otp code"));
    return;
  }
  const expiry = setExpiryInUTC(24);

  if (isExpired(cachedSession.expiry as string)) {
    next(
      ApiError.error(ErrorCodes.UNAUTHORIZED, "OTP session expired or invalid")
    );
    return;
  }

  const user = await Alias.findByPkWithCache(alias_id);

  const sessionObj: IAuthSession = {
    expiry,
    ip_address:
      req.headers["x-forwarded-for"]! || req.connection.remoteAddress!,
    user_agent: req.headers["user-agent"]!,
    alias_id,
    socket_auth_hash: hashSync(alias_id, 5),
  };
  const authSessionId = randomBytes(15).toString("base64url");

  memcachedService.set(
    CacheKeys.authSession(authSessionId),
    sessionObj,
    24 * 60 * 60
  );
  memcachedService.delete(CacheKeys.otp(user!.email));

  const cookieOpts: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    signed: true,
  };

  res.cookie(sessionCookieKey, authSessionId, cookieOpts);

  res.json({ status: "ok", message: "OTP verified" });
}

("----- invalidateOtp ------");
export async function invalidateOtp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.signedCookies[sessionCookieKey];

  memcachedService.delete(CacheKeys.authSession(sessionId));
  res.clearCookie(sessionCookieKey);
  res.json({ status: "ok", message: "OTP invalidated" });
}

("----- getOtpExpiration ------");
export async function getOtpExpiration(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = await getSessionFromReq(req);
  if (!session) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid session"));
    return;
  }
  const find = await Alias.findByPkWithCache(session.alias_id);
  res.json({
    status: "ok",
    message: "OTP expiration retrieved",
    data: {
      expiry: session.expiry,
      alias_id: session.alias_id,
      name: find?.name,
      is_valid_auth: isExpired(session.expiry) ? false : true,
    },
  });
}

("----- searchAlias ------");
export async function searchAlias(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const name = req.query.name;
  const data = await Alias.findAll({
    where: {
      name: {
        [Op.like]: `%${name}%`,
      },
    },
  });
  res.json({ status: "ok", data: { rows: data } });
}

("----- getAliasById ------");
export async function getAliasById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const aliasId = req.params["alias_id"];

  const find = await Alias.findByPkWithCache(aliasId);

  if (!find) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Alias not found"));
    return;
  }

  res.json({
    status: "ok",
    data: {
      ...find,
      id: aliasId,
    },
  });
}

type IEditTask = {
  date: Date;
  name: string;
  reminder: Date;
  participants: _IAlias[];
  duration: string;
};

export async function editTaskSchedule(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const task_id = req.params.task_id;
  console.log(req.body);

  const { date, name, participants, reminder, duration } =
    req.body as IEditTask;

  const findTask = await Task.findByPkWithCache(task_id);

  if (date && !isDate(new Date(date))) {
    next(
      ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid tasks to update")
    );
    return;
  }
  let newTask = { ...findTask! };

  if (date) {
    newTask = { ...newTask, date };
  }
  if (name) {
    newTask = { ...newTask, name };
  }
  if (reminder) {
    newTask = { ...newTask, reminder };
  }

  if (duration) {
    const time = parseLiteralTime(duration);
    if (!time) {
      next(
        ApiError.error(
          ErrorCodes.VALIDATION_ERROR,
          "The duration must be provided in a valid 'number unit' format."
        )
      );
      return;
    }

    newTask = { ...newTask, duration };
  }

  if (
    participants &&
    (!Array.isArray(participants) ||
      participants.some((i) => !validate(i.id)) ||
      participants.length === 0)
  ) {
    next(
      ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid participants list")
    );
    return;
  }
  const previousParticipants = await PopulateTaskParticipants(task_id);

  for (let alias of previousParticipants as IAlias[]) {
    const find = participants?.find((i) => i.id === alias.id);
    if (find) {
      next(
        ApiError.error(
          ErrorCodes.CONFLICT,
          `${alias.name} is already a participant`
        )
      );
      return;
    }
  }

  participants &&
    participants.forEach(async (i) => {
      await TaskParticipant.findOrCreate({
        defaults: {
          alias_id: i.id,
          task_id,
        },
        where: {
          alias_id: i.id,
          task_id,
        },
      });
    });

  Task.updateByIdWithCache(task_id, newTask);

  res.json({
    status: "ok",
    message: "Schedule updated",
  });
}
export async function createTaskSchedule(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const count = await Task.count({ where: { note_id: req.params.note_id } });

  if (count === 2) {
    next(ApiError.error(ErrorCodes.PAYMENT_REQUIRED, "Task limit reached"));
    return;
  }
  const scheduledDate = setExpiryInUTC(2) as any;

  const reminder = setExpiryInUTC(1) as any;

  Task.create({
    alias_id: req.__alias!.id!,
    note_id: req.params.note_id,
    name: "Study prep",
    date: scheduledDate,
    reminder,
    duration: "30 minutes",
  });

  res.json({
    status: "ok",
    message: "Schedule task complete",
  });
}

export async function createNoteSummary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { text, start_index, end_index } = req.body;

  const note_id = req.params["note_id"];
  const find = await Note.findByPkWithCache(note_id);

  const textToSummerise = text ?? find!.content;

  try {
    const data = {
      new_content: text.slice(5, text.length - 5),
      old_content: text,
      end_index: start_index + end_index,
      start_index,
    };

    res.json({
      status: "ok",
      message: "Summary completed",
      data,
    });
  } catch (err) {
    next(
      ApiError.error(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Could not process request"
      )
    );
  }
}
export async function getSingleTask(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const task_id = req.params.task_id;

  const task = await Task.findByPkWithCache(task_id);

  res.json({
    status: "ok",
    data: {
      task,
      participants: await PopulateTaskParticipants(task_id, task?.alias_id!),
    },
  });
}
export async function getAllTasksForNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const pagination = req.__pagination__;
  const rows = (await Task.findAll({
    where: {
      note_id: req.params.note_id,
    },
    limit: pagination!.page_size,
    offset: (pagination!.page - 1) * pagination!.page_size,
    order: [["createdAt", "DESC"]],
    raw: true,
  })) as any as ITask[];

  res.json({
    status: "ok",
    data: {
      rows: await PopulateParticipantForTasks(rows),
      pagination: req.__pagination__,
    },
  });
}

export async function getAllTasksForAuthorisedAlias(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const pagination = req.__pagination__;
  const rows = (await Task.findAll({
    where: {
      alias_id: req.__alias!.id,
    },
    limit: pagination!.page_size,
    offset: (pagination!.page - 1) * pagination!.page_size,
    order: [["createdAt", "DESC"]],
    raw: true,
  })) as any as ITask[];

  res.json({
    status: "ok",
    data: {
      rows: await PopulateParticipantForTasks(rows),
      pagination: req.__pagination__,
    },
  });
}

("----- registerAlias ------");
export async function registerAlias(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const body: Partial<IAlias> = req.body;
  let { name, email } = body;
  if (!name || !email || !isValidEmail(email)) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "Please enter a valid name and email address"
      )
    );

    return;
  }
  name = name.toLowerCase();

  const valid = validateUsername(name);
  if (!valid.isValid) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, valid.error));
    return;
  }

  const count = await Alias.count({ where: { name } });
  if (count > 0) {
    next(ApiError.error(ErrorCodes.CONFLICT, "Alias already exists"));
    return;
  }
  const countEmail = await Alias.count({ where: { email } });
  if (countEmail > 0) {
    next(ApiError.error(ErrorCodes.CONFLICT, "Email already exists"));
    return;
  }
  Alias.create({ name, email: (email as string) ?? null });
  res.json({ status: "ok", message: "Alias created!" });
}

export async function getNote(req: Request, res: Response, next: NextFunction) {
  const all = await Note.findAll({ where: { is_hidden: false } });
  res.json({ status: "ok", data: { rows: all } });
}

("----- deleteNote ------");
export async function deleteNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params["note_id"];

  Note.destroy({ where: { alias_id: req.__alias?.id, id: note_id } });
  res.json({ status: "ok", message: "Note has been deleted " });
}

("----- editNote ------");
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

("----- getNoteById ------");
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
    slug: find!.slug,
    is_hidden: find!.is_hidden,
    will_self_destroy: find!.will_self_destroy,
    self_destroy_time: find!.self_destroy_time,
    alias_id: find!.alias_id,
    id: find!.id,
  };

  res.json({
    status: "ok",
    message: "Note retrieved",
    data: {
      note,
      collaborators: await PopulateNoteCollaborators(note.id!, find!.alias_id),
    },
  });
}

("----- getAuthorizedAliasNotes ------");
export async function getAuthorizedAliasNotes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const alias_id = req.__alias?.id!;

  let notes = (await Note.findAll({
    where: {
      alias_id,
      [Op.or]: [
        { is_hidden: true },
        { is_hidden: null },
        { is_hidden: false } as any,
      ],
    },
    raw: true,
    attributes: NoteAttributes,
  })) as any as INote[];

  res.json({
    status: "ok",
    data: {
      rows: await PopulateCollaboratorForNotes(notes),
    },
  });
}

("----- getAllNotes ------");
export async function getAllNotes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let notes = (await Note.findAll({
    where: { [Op.or]: [{ is_hidden: false }, { is_hidden: null } as any] },
    attributes: NoteAttributes,
    raw: true,
  })) as any as INote[];

  res.json({
    status: "ok",
    data: {
      rows: await PopulateCollaboratorForNotes(notes),
    },
  });
}

export async function getTaskParticipants(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const task_id = req.params.task_id;

  res.json({
    status: "ok",
    data: {
      rows: await PopulateTaskParticipants(task_id),
    },
  });
}

export async function getNoteCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params.note_id;

  res.json({
    status: "ok",
    data: {
      rows: await PopulateNoteCollaborators(note_id),
    },
  });
}

export async function addNoteCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { collaborators }: { collaborators: { id: string }[] } = req.body;
  const note_id = req.params.note_id;

  if (
    !collaborators ||
    !Array.isArray(collaborators) ||
    collaborators.some((i) => !validate(i.id)) ||
    collaborators.length === 0
  ) {
    next(
      ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid collaborators list")
    );
    return;
  }

  if (collaborators.some((i) => i.id === req.__alias!.id)) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "You are already a default collaborator and cannot be added again."
      )
    );
    return;
  }

  const existingCollaborators = await PopulateNoteCollaborators(note_id);

  for (let alias of existingCollaborators as IAlias[]) {
    const find = collaborators.find((i) => i.id === alias.id);
    if (find) {
      next(
        ApiError.error(
          ErrorCodes.CONFLICT,
          `${alias.name} is already a collaborator`
        )
      );
      return;
    }
  }

  collaborators.forEach(async ({ id }: any) => {
    await NoteCollaborator.findOrCreate({
      where: { note_id, alias_id: id },
      defaults: { note_id, alias_id: id },
    });
  });

  res.json({
    status: "ok",
    message: "Collaborators added successfully",
  });
}

export async function deleteTaskParticipant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { task_id, alias_id } = req.body;

  const find = await Task.findByPk(task_id, { attributes: ["alias_id"] });

  if (find && find.dataValues.alias_id === alias_id) {
    next(
      ApiError.error(
        ErrorCodes.FORBIDDEN,
        "You cannot delete the default participant"
      )
    );
    return;
  }

  TaskParticipant.destroy({ where: { task_id, alias_id } });
  res.json({
    status: "ok",
    message: "Participant deleted",
  });
}

export async function deleteNoteCollaborator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { note_id, alias_id } = req.body;

  const find = await Note.findByPk(note_id, { attributes: ["alias_id"] });

  if (find && find.dataValues.alias_id === alias_id) {
    next(
      ApiError.error(
        ErrorCodes.FORBIDDEN,
        "You cannot delete the default collaborator"
      )
    );
    return;
  }

  NoteCollaborator.destroy({ where: { note_id, alias_id } });
  res.json({
    status: "ok",
    message: "Collaborator deleted",
  });
}

("----- createNote ------");
export async function createNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note: IncomingNote = req.body;
  const valid = validateIncomingNote(note, "create");

  if (!valid.isValid) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, valid.error));

    return;
  }
  const { title, is_hidden } = note;

  const findAlias = await Alias.findByPkWithCache(req.__alias?.id!);

  if (!findAlias) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Alias not found"));
    return;
  }

  const slug = generateSlug(title!, 5, is_hidden ?? false);

  Note.create({ ...valid.data, slug, alias_id: req.__alias!.id! });

  res.json({ status: "ok", message: "Note has been saved to your alias!" });
}
