import { CookieOptions, NextFunction, Request, Response } from "express";
import Alias from "./models/Alias";
import { validate } from "uuid";
import {
  ApiError,
  generateSlug,
  getRandomInt,
  getSession,
  isAuthorizedAlias,
  isExpired,
  parseSelfDestroyTimeToDate,
  sendEmail,
  setExpiryInUTC,
  validateIncomingNote,
  validateUsername,
} from "./helpers";
import { ErrorCodes, IAlias, IncomingNote, INote, IOtpSession } from "./type";
import {
  NoteAttributes,
  CacheKeys,
  otpSessionCookieKey,
  sessionCookieKey,
  AliasAttributes,
} from "./constants";
import memcachedService from "./memcached";
import { randomBytes } from "crypto";
import { compareSync, hashSync } from "bcrypt";
import Note from "./models/Note";
import { Op } from "sequelize";
import NoteCollaborator from "./models/NoteCollaborator";

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

  const user = await Alias.findOne({
    where: { id: alias_id },
    attributes: ["email"],
  });

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

  sendEmail({
    html: `Your code ${code}`,
    receiver: user.dataValues.email,
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

  const valid = compareSync(code, cachedSession.auth_code_hash);
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

  const user = await Alias.findByPk(alias_id, { attributes: ["email"] });

  const sessionObj = {
    expiry,
    ip_address:
      req.headers["x-forwarded-for"]! || req.connection.remoteAddress!,
    user_agent: req.headers["user-agent"]!,
    alias_id,
  };
  const authSessionId = randomBytes(15).toString("base64url");

  memcachedService.set(
    CacheKeys.authSession(authSessionId),
    sessionObj,
    24 * 60 * 60
  );
  memcachedService.delete(CacheKeys.otp(user!.dataValues.email));

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
  const session = await getSession(req);
  if (!session) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid session"));
    return;
  }
  const find = await Alias.findByPk(session.alias_id, { attributes: ["name"] });
  res.json({
    status: "ok",
    message: "OTP expiration retrieved",
    data: {
      expiry: session.expiry,
      alias_id: session.alias_id,
      name: find?.dataValues.name,
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

  const attrs = ["name"];
  const find = await Alias.findByPk(aliasId, { attributes: attrs, raw: true });

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

("----- registerAlias ------");
export async function registerAlias(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const body: Partial<IAlias> = req.body;
  let { name, email } = body;
  if (!name || !email) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "Alias must have a name an a recovery email"
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

("----- export async function getNote(req: Request, res: Response, next: NextFunction) { ------");
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

  Note.destroy({ where: { alias_id: req.alias?.id, id: note_id } });
  res.json({ status: "ok", message: "Note has been deleted " });
}

("----- editNote ------");
export async function editNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params["note_id"];
  const note: Partial<{ title: string; content: string }> = req.body;

  if (!note.title && !note.content) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "No data to update"));
    return;
  }

  const data: any = {};

  if (note.title) {
    data.title = note.title;
  }
  if (note.content) {
    data.content = note.content;
  }

  Note.update(data, { where: { id: note_id } });
  res.json({ status: "ok", message: "Note updated" });
}

("----- getNoteBySlug ------");
export async function getNoteBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const slug = req.params.note_slug;

  const secret = req.get("Authorization");

  const find = await Note.findOne({
    where: { slug },
    attributes: [
      "id",
      "title",
      "slug",
      "is_hidden",
      "will_self_destroy",
      "self_destroy_time",
      "content",
      "createdAt",
      "alias_id",
      "secret",
    ],
  });

  if (!find) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Note not found"));
    return;
  }

  const note = {
    title: find?.dataValues.title,
    content: find?.dataValues.content,
    createdAt: find?.dataValues.createdAt,
    slug: find?.dataValues.slug,
    is_hidden: find.dataValues.is_hidden,
    will_self_destroy: find.dataValues.will_self_destroy,
    self_destroy_time: find.dataValues.self_destroy_time,
    alias_id: find.dataValues.alias_id,
    id: find.dataValues.id,
  };

  if (find?.dataValues.is_hidden) {
    const authAlias = await isAuthorizedAlias(req, find.dataValues.alias_id);
    if (
      !authAlias &&
      (!secret ||
        secret === undefined ||
        typeof secret !== "string" ||
        !compareSync(secret, find.dataValues.secret))
    ) {
      next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Action not permitted"));

      return;
    }
  }
  res.json({
    status: "ok",
    message: "Note retrieved",
    data: {
      note,
      collaborators: await PopulateCollaborators(note.id!),
    },
  });
}

("----- getAuthorizedAliasNotes ------");
export async function getAuthorizedAliasNotes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const alias_id = req.alias?.id!;

  let notes = await Note.findAll({
    where: {
      alias_id,
      [Op.or]: [
        { is_hidden: true },
        { is_hidden: null },
        { is_hidden: false } as any,
      ],
    },
    attributes: NoteAttributes,
  });

  const data = await Promise.all(
    notes.map(async (i) => {
      const f = await Alias.findByPk(i.dataValues.alias_id, {
        attributes: AliasAttributes,
      });
      return { collaborators: [f?.dataValues], note: i };
    })
  );
  res.json({
    status: "ok",
    data: {
      rows: JSON.parse(JSON.stringify(data)),
    },
  });
}

("----- getAllNotes ------");
export async function getAllNotes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let notes = await Note.findAll({
    where: { [Op.or]: [{ is_hidden: false }, { is_hidden: null } as any] },
    attributes: NoteAttributes,
  });

  let data = await Promise.all(
    notes.map(async (i) => ({
      collaborators: await PopulateCollaborators(i.dataValues.id!),
      note: i,
    }))
  );
  JSON.parse(JSON.stringify(data)),
    res.json({
      status: "ok",
      data: {
        rows: data,
      },
    });
}

("----- getAliasNotes ------");
export async function getAliasNotes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const alias_id = req.params.alias_id;

  let notes = await Note.findAll({
    where: {
      alias_id,
      [Op.or]: [{ is_hidden: false }, { is_hidden: null } as any],
    },
    attributes: NoteAttributes,
  });
  let data = await Promise.all(
    notes.map(async (i) => ({
      collaborators: await PopulateCollaborators(i.dataValues.id!),
      note: i,
    }))
  );
  (data = JSON.parse(JSON.stringify(data))),
    res.json({
      status: "ok",
      data: {
        rows: data,
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
      rows: await PopulateCollaborators(note_id),
    },
  });
}

async function PopulateCollaborators(note_id: string) {
  const find = await NoteCollaborator.findAll({
    where: { note_id },
  });

  const rows = await Promise.all(
    find.map(
      async (i) =>
        await Alias.findByPk(i.dataValues.alias_id, {
          attributes: ["id", "name"],
          raw: true,
        })
    )
  );

  return rows;
}

export async function addNoteCollaborators(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { collaborators } = req.body;
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

  if (collaborators.some((i) => i.id === req.alias!.id)) {
    next(
      ApiError.error(
        ErrorCodes.VALIDATION_ERROR,
        "You are already a default collaborator and cannot be added again."
      )
    );
    return;
  }

  collaborators.forEach(({ id }: any) => {
    NoteCollaborator.findOrCreate({
      where: { note_id, alias_id: id },
      defaults: { note_id, alias_id: id },
    });
  });

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
  const { note }: { alias_id: string; note: IncomingNote } = req.body;
  const {
    content,
    title,
    is_hidden,
    secret,
    self_destroy_time,
    will_self_destroy,
  } = note;

  const valid = validateIncomingNote(note);
  if (!valid.isValid) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, valid.error));

    return;
  }

  const findAlias = await Alias.findByPk(req.alias?.id!);

  if (!findAlias) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Alias not found"));
    return;
  }

  const slug = generateSlug(title!, 5, is_hidden ?? false);

  const update: any = {
    title,
    content,
    slug,
    alias_id: req.alias?.id!,
  };
  if (will_self_destroy && self_destroy_time) {
    const time = parseSelfDestroyTimeToDate(self_destroy_time) as Date;
    if (!time) {
      next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid time"));
      return;
    }
    update.self_destroy_time = time;
    update.will_self_destroy = true;
  }
  if (is_hidden) {
    update.secret =
      secret && secret.trim().length > 0 ? hashSync(secret, 10) : null;
    update.is_hidden = true;
  }

  await Note.create(update);

  res.json({ status: "ok", message: "Note has been saved to your alias!" });
}
