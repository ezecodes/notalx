import { CookieOptions, NextFunction, Request, Response } from "express";
import User from "./models/User";
import { validate } from "uuid";
import {
  ApiError,
  QueryLLM1,
  generateSlug,
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
  fanOutNotification,
  queryVectors,
  audioTransciption,
} from "./helpers";
import {
  _IUser,
  ErrorCodes,
  IUser,
  IAuthSession,
  IncomingNote,
  INote,
  INoteCollaborator,
  IOtpSession,
  ISummaryResponse,
  ITask,
  NotificationType,
} from "./type";
import {
  CacheKeys,
  otpSessionCookieKey,
  sessionCookieKey,
  SUMMARY_PROMPT_VARIATIONS,
  TASK_SCHEDULING_PROMPT_VARIATIONS,
  uploadDir,
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
import Notification from "./models/Notification";
import NoteHistory from "./models/NoteHistory";
import formidable, { IncomingForm } from "formidable";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { unlinkSync } from "fs";

export async function getAllUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const all = await User.findAll({ where: {}, attributes: ["id", "name"] });
  res.json({ status: "ok", data: { rows: all } });
}

("----- requestOtp ------");
export async function requestOtp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    next(
      ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Provide a valid email")
    );

    return;
  }

  const user = (await User.findOne({
    where: { email },
    raw: true,
  })) as any as IUser;

  if (!user) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Email is invalid"));

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
    email,
    expiry,
    auth_code_hash,
  };
  memcachedService.set(CacheKeys.otp(otpSessionSlug), cache, 3600);

  sendEmail({
    html: `Your code ${code}`,
    receiver: user.email,
    subject: "Your OTP",
  });
  res.cookie(otpSessionCookieKey, otpSessionSlug, cookieOpts);

  res.json({ status: "ok", message: "OTP sent to email" });
}

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { email, code } = req.body;
  if (!email || !isValidEmail(email) || !code) {
    next(
      ApiError.error(
        ErrorCodes.RESOURCE_NOT_FOUND,
        "Please ensure that both Email and OTP code are provided in the request"
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
  if (email !== cachedSession.email || !valid) {
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

  const user = (await User.findOne({
    where: { email },
    raw: true,
  })) as any as IUser;

  const sessionObj: IAuthSession = {
    expiry,
    ip_address:
      req.headers["x-forwarded-for"]! || req.connection.remoteAddress!,
    user_agent: req.headers["user-agent"]!,
    user_id: user.id,
    socket_auth_hash: hashSync(user.id, 5),
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
  const find = await User.findByPkWithCache(session.user_id);
  res.json({
    status: "ok",
    message: "OTP expiration retrieved",
    data: {
      expiry: session.expiry,
      user_id: session.user_id,
      name: find?.name,
      is_valid_auth: isExpired(session.expiry) ? false : true,
    },
  });
}

export async function searchUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const name = req.query.name;
  const data = await User.findAll({
    where: {
      name: {
        [Op.like]: `%${name}%`,
      },
    },
  });
  res.json({ status: "ok", data: { rows: data } });
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.params["user_id"];

  const find = await User.findByPkWithCache(userId);

  if (!find) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "No account found"));
    return;
  }

  res.json({
    status: "ok",
    data: {
      ...find,
      id: userId,
    },
  });
}

type IEditTask = {
  date: Date;
  name: string;
  reminder: Date;
  participants: _IUser[];
  duration: string;
};

export async function editTaskSchedule(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const task_id = req.params.task_id;

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

  for (let user of previousParticipants as IUser[]) {
    const find = participants?.find((i) => i.id === user.id);
    if (find) {
      next(
        ApiError.error(
          ErrorCodes.CONFLICT,
          `${user.name} is already a participant`
        )
      );
      return;
    }
  }

  if (participants && participants.length > 0) {
    participants.forEach(async (i) => {
      await TaskParticipant.findOrCreate({
        defaults: {
          user_id: i.id,
          task_id,
        },
        where: {
          user_id: i.id,
          task_id,
        },
      });
    });
    fanOutNotification(
      NotificationType.AddedParticipant,
      {
        title: "You've Been Added!",
        message: "You're now a participant. Welcome aboard!",
        metadata: {
          task_id,
        },
      },
      participants.map((i) => i.id)
    );
  }

  Task.updateByIdWithCache(task_id, newTask);

  res.json({
    status: "ok",
    message: "Schedule updated",
  });
}
type ITaskFromLLM = {
  success: boolean;
  message?: string;
  tasks: {
    task_title: string;
    date: string;
    time: string;
    participants: string[];
    location: string | string[];
  }[];
};
export async function createTaskSchedule(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const count = await Task.count({ where: { user_id: req.__user__!.id } });

  // if (count >= 2) {
  //   next(ApiError.error(ErrorCodes.PAYMENT_REQUIRED, "Task limit reached"));
  //   return;
  // }
  try {
    const note = await Note.findByPkWithCache(req.params.note_id);
    const newTask = await QueryLLM1(
      note?.content!,
      TASK_SCHEDULING_PROMPT_VARIATIONS[0].prompt
    );

    if (!newTask.success) {
      next(ApiError.error(ErrorCodes.INTERNAL_SERVER_ERROR, "Could not fetch"));
      return;
    }

    let parsedTask: ITaskFromLLM = JSON.parse(newTask.result.response);

    if (!parsedTask.success) {
      next(
        ApiError.error(
          ErrorCodes.VALIDATION_ERROR,
          "Task could not be generated from the provided note content"
        )
      );
      return;
    }

    const tasks = parsedTask.tasks.map((task) => {
      const dateTimeString = `${task.date} ${task.time}`;
      const newTask: any = {
        name: task.task_title,
        participants: task.participants,
        location: task.location,
      };

      // Create a new Date object
      let dateTime = new Date(dateTimeString);
      const now = new Date();

      if (dateTime < now) {
        dateTime = new Date(now.getTime() + 60 * 60 * 1000);
      }

      if (isNaN(dateTime as any)) {
        newTask.date = setExpiryInUTC(2);
        newTask.reminder = setExpiryInUTC(1);
      } else {
        newTask.date = dateTime;
        newTask.reminder = new Date(dateTime.getTime() - 15 * 60 * 1000);
      }

      return newTask;
    });

    tasks.forEach(async (task) => {
      await Task.create({
        user_id: req.__user__!.id!,
        note_id: req.params.note_id,
        name: task.name,
        date: task.date,
        reminder: task.reminder,
        duration: "1 hour",
      });
    });

    res.json({
      status: "ok",
      message: "Schedule task complete",
    });
  } catch (err) {
    console.error(err);
    next(
      ApiError.error(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Task generation failed. Please try again later."
      )
    );
  }
}

export async function readNotifications(notificationIds: string[]) {
  if (notificationIds.some((id) => !validate(id))) {
    return;
  }

  notificationIds.forEach(
    async (id) => await Notification.updateByIdWithCache(id, { is_read: true })
  );
}

export async function transcribeAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const inputPath = req.file!.path; // Temporary path
  const outputPath = path.join(uploadDir, `${Date.now()}.mp3`);

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
      participants: await PopulateTaskParticipants(task_id, task?.user_id!),
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
      user_id: req.__user__!.id,
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

export async function getAllTasksForAuthorisedUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const pagination = req.__pagination__;
  const rows = (await Task.findAll({
    where: {
      user_id: req.__user__!.id,
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

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const body: Partial<IUser> = req.body;
  let { name, email } = body;
  if (!name || !email || !isValidEmail(email)) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "Please provide a valid name and email address to proceed."
      )
    );

    return;
  }
  name = name.trim();
  const valid = validateUsername(name);
  if (!valid.isValid) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, valid.error));
    return;
  }

  const count = await User.count({ where: { name } });
  if (count > 0) {
    next(ApiError.error(ErrorCodes.CONFLICT, "Account already exists"));
    return;
  }
  const countEmail = await User.count({ where: { email } });
  if (countEmail > 0) {
    next(ApiError.error(ErrorCodes.CONFLICT, "Email already exists"));
    return;
  }
  const user = (await User.create(
    { name, email: (email as string) ?? null },
    { returning: true, raw: true }
  )) as any as IUser;

  fanOutNotification(
    NotificationType.WelcomeMessage,
    {
      title: "Welcome to Our Platform!",
      message: "Thank you for registering. We're excited to have you on board!",
      metadata: {},
    },
    [user.id]
  );

  res.json({ status: "ok", message: "Account created!" });
}

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const rows = await Notification.findByUser(
    req.__user__!.id!,
    req.__pagination__!
  );
  res.json({
    status: "ok",
    data: {
      rows,
      pagination: req.__pagination__!,
    },
  });
}

export async function getNote(req: Request, res: Response, next: NextFunction) {
  const all = await Note.findAllWithCache(req.__pagination__!);
  res.json({ status: "ok", data: { rows: all } });
}

export async function deleteNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params["note_id"];

  Note.destroy({ where: { user_id: req.__user__?.id, id: note_id } });
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

  NoteHistory.create({
    changes: valid.data,
    note_id,
    updated_by: req.__user__!.id,
  });

  res.json({ status: "ok", message: "Note updated" });
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
    user_id: find!.user_id,
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

export async function getAuthorizedUserNotes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user_id = req.__user__?.id!;

  let notes = (await Note.findAll({
    where: {
      user_id,
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
export async function getNotesSharedWithUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user_id = req.__user__?.id!;

  const findJoins = (await NoteCollaborator.findAll({
    where: { user_id },
    raw: true,
    order: [["updatedAt", "DESC"]],
  })) as any as INoteCollaborator[];
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

export async function getTopTags(
  req: Request,
  res: Response,
  next: NextFunction
) {}

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
export async function getNoteCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const rawNotes = await Note.findAll({
    where: { user_id: req.__user__!.id },
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

export async function getAllNotes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let notes = await Note.findAllWithCache(req.__pagination__!);

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

  const user = await User.findByPkWithCache(req.__user__!.id);
  const note = await Note.findByPkWithCache(req.params.note_id);

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

  if (collaborators.some((i) => i.id === req.__user__!.id)) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "You are already a default collaborator and cannot be added again."
      )
    );
    return;
  }

  const existingCollaborators = await PopulateNoteCollaborators(note_id);

  for (let user of existingCollaborators as IUser[]) {
    const find = collaborators.find((i) => i.id === user.id);
    if (find) {
      next(
        ApiError.error(
          ErrorCodes.CONFLICT,
          `${user.name} is already a collaborator`
        )
      );
      return;
    }
  }

  collaborators.forEach(async ({ id }: any) => {
    await NoteCollaborator.findOrCreate({
      where: { note_id, user_id: id },
      defaults: { note_id, user_id: id },
    });
  });

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
    collaborators.map((i) => i.id)
  );

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
  const { task_id, user_id } = req.body;

  const find = await Task.findByPk(task_id, { attributes: ["user_id"] });

  if (find && find.dataValues.user_id === user_id) {
    next(
      ApiError.error(
        ErrorCodes.FORBIDDEN,
        "You cannot delete the default participant"
      )
    );
    return;
  }

  TaskParticipant.destroy({ where: { task_id, user_id } });
  res.json({
    status: "ok",
    message: "Participant deleted",
  });
}

("----- createNote ------");
