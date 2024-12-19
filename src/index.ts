import express, {
  CookieOptions,
  NextFunction,
  Request,
  Response,
  Router,
} from "express";
import path from "path";
import Alias from "./models/Alias";
import Note from "./models/Note";
import { ErrorCodes, IAlias, INote } from "./type";
import { connectDb } from "./sequelize";
import { compareSync, hashSync } from "bcrypt";
import morgan from "morgan";
import { Op } from "sequelize";
import { randomBytes } from "crypto";
import { validate } from "uuid";
import { createTransport } from "nodemailer";
import cron from "node-cron";

import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import memcachedService from "./memcache";
dotenv.config();

const server = express();
const sessionKey = "s-tkn";
const Brand = "Notal X";

const mailConfig = {
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASSWORD,
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
};

const CacheKeys = {
  otp: (email: string) => `otp:${email}`,
  session: (sessionId: string) => `session:${sessionId}`,
};

server.use(cookieParser(process.env.COOKIE_SECRET));
server.use(express.json({ limit: "5mb" }));
server.use(express.urlencoded({ extended: false }));
server.use(morgan("tiny"));

const ApiRoute = Router();
server.use("/api", ApiRoute);

ApiRoute.get("/alias", async (req: Request, res: Response) => {
  const all = await Alias.findAll({ where: {}, attributes: ["id", "name"] });
  res.json({ status: "ok", data: { rows: all } });
});

const invalidEmailAliasCombo = "Email and alias combination is not valid";
ApiRoute.post("/otp/send", async (req: Request, res: Response) => {
  const { email, alias_id } = req.body;

  if (!alias_id) {
    res.status(400).json({
      status: "err",
      message: invalidEmailAliasCombo,
    });
    return;
  }

  const user = await Alias.findOne({
    where: { email, id: alias_id },
    attributes: ["id", "name"],
  });

  if (!user) {
    res.status(400).json({
      status: "err",
      message: invalidEmailAliasCombo,
    });
    return;
  }

  const code = randomBytes(2).toString("hex");

  memcachedService.set(CacheKeys.otp(email), hashSync(code, 10), 3600);

  sendEmail({
    html: `Your code ${code}`,
    receiver: email,
    subject: "Your OTP",
  });

  res.json({ status: "ok", message: "OTP sent to email" });
});

ApiRoute.post("/otp/verify", async (req: Request, res: Response) => {
  const { code, email } = req.body;
  const user = await Alias.findOne({
    where: { email },
    attributes: ["id"],
  });

  if (!user) {
    res.json({ status: "err", message: "Email is not valid" });
    return;
  }

  const otp = await memcachedService.get(CacheKeys.otp(email));

  if (!otp) {
    res.status(400).json({ status: "err", message: "Invalid Otp code" });
    return;
  }

  const valid = compareSync(code, otp as string);
  if (!valid) {
    res.status(400).json({ status: "err", message: "Invalid Otp code" });
    return;
  }
  const expiry = setExpiryInUTC(1);

  const sessionObj = {
    expiry,
    ip_address:
      req.headers["x-forwarded-for"]! || req.connection.remoteAddress!,
    user_agent: req.headers["user-agent"]!,
    alias_id: user.dataValues.id!,
  };
  const id = randomBytes(10).toString("hex");

  memcachedService.set(CacheKeys.session(id), sessionObj, 86400);
  memcachedService.delete(CacheKeys.otp(email));

  const cookieOpts: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1440 * 60 * 1000, // 60 minutes
    signed: true,
  };

  res.cookie(sessionKey, id, cookieOpts);

  res.json({ status: "ok", message: "OTP verified" });
});

ApiRoute.delete("/otp/invalidate", async (req: Request, res: Response) => {
  const sessionId = req.signedCookies[sessionKey];

  memcachedService.delete(CacheKeys.session(sessionId));
  res.clearCookie(sessionKey);
  res.json({ status: "ok", message: "OTP invalidated" });
});
ApiRoute.get("/otp/expiry", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) {
    res.status(400).json({ status: "err", message: "Invalid session" });
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
      is_valid_auth: isSessionExpired(session.expiry) ? false : true,
    },
  });
});

ApiRoute.get("/alias/search", async (req: Request, res: Response) => {
  const name = req.query.name;
  const data = await Alias.findAll({
    where: {
      name: {
        [Op.like]: `%${name}%`,
      },
    },
  });
  res.json({ status: "ok", data: { rows: data } });
});

ApiRoute.get("/alias/:alias_id", async (req: Request, res: Response) => {
  const aliasId = req.params["alias_id"];

  const attrs = ["name"];
  const authAlias = await isAuthorizedAlias(req, aliasId);
  const find = await Alias.findByPk(aliasId, { attributes: attrs, raw: true });
  if (authAlias) {
    attrs.push("email");
  }

  if (!find) {
    res.status(400).json({
      status: "err",
      error_code: ErrorCodes.RESOURCE_NOT_FOUND,
      message: "Alias not found",
    });
    return;
  }

  res.json({
    status: "ok",
    data: {
      ...find,
      id: aliasId,
    },
  });
});

ApiRoute.post("/alias", async (req: Request, res: Response) => {
  const body: Partial<IAlias> = req.body;
  let { name, email } = body;
  if (!name || !email) {
    res.status(400).json({
      status: "err",
      error_code: ErrorCodes.VALIDATION_ERROR,
      message: "Alias must have a name an a recovery email",
    });
    return;
  }
  name = name.toLowerCase();

  const valid = validateUsername(name);
  if (!valid.isValid) {
    res.json({
      status: "err",
      message: valid.error,
      error_code: ErrorCodes.VALIDATION_ERROR,
    });
    return;
  }

  const count = await Alias.count({ where: { name } });
  if (count > 0) {
    res.json({ status: "err", message: "Alias already exists" });
    return;
  }
  const countEmail = await Alias.count({ where: { email } });
  if (countEmail > 0) {
    res.json({ status: "err", message: "Email already exists" });
    return;
  }
  Alias.create({ name, email: (email as string) ?? null });
  res.json({ status: "ok", message: "Alias created!" });
});

ApiRoute.get("/note", async (req: Request, res: Response) => {
  const all = await Note.findAll({ where: { is_hidden: false } });
  res.json({ status: "ok", data: { rows: all } });
});
ApiRoute.delete(
  "/note/delete/:note_id",
  async (req: Request, res: Response) => {
    const note_id = req.params["note_id"];

    if (!validate(note_id)) {
      res.status(400).json({ status: "err", message: "Invalid Note" });
      return;
    }

    Note.destroy({ where: { id: note_id } });
    res.json({ status: "ok", message: "Note has been deleted " });
  }
);
const authErrMsg = "Action not permitted";

ApiRoute.put(
  "/note/edit/:note_id",
  validateNoteId,
  async (req: Request, res: Response) => {
    const note_id = req.params["note_id"];
    const note: Partial<{ title: string; content: string }> = req.body;

    if (!note.title && !note.content) {
      res.status(400).json({ status: "err", message: "No data to update" });
      return;
    }

    const find = await Note.findByPk(note_id, {
      attributes: ["alias_id"],
    });

    if (!find) {
      res.status(400).json({ status: "err", message: "Note not found " });
      return;
    }

    const authAlias = await isAuthorizedAlias(req, find.dataValues.alias_id);
    if (!authAlias) {
      res.status(400).json({
        status: "err",
        error_code: ErrorCodes.UNAUTHORIZED,
        message: authErrMsg,
      });
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
);
ApiRoute.get("/note/:note_slug", async (req: Request, res: Response) => {
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
    res.status(400).json({ status: "err", message: "Note not found" });
    return;
  }

  const data = {
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
      res.status(400).json({
        status: "err",
        message: authErrMsg,
        error_code: ErrorCodes.UNAUTHORIZED,
      });
      return;
    }
  }
  res.json({
    status: "ok",
    message: "Note retrieved",
    data,
  });
  return;
});
ApiRoute.get(
  "/note/alias/:alias_id",
  validateAliasId as any,
  async (req: Request, res: Response) => {
    const aliasId = req.params.alias_id;
    const authAlias = await isAuthorizedAlias(req, aliasId);

    let clause: any = { alias_id: aliasId };
    if (!authAlias) {
      clause = {
        ...clause,
        [Op.or]: [{ is_hidden: false }, { is_hidden: null } as any],
      };
    } else {
      clause = {
        ...clause,
        [Op.or]: [
          { is_hidden: true },
          { is_hidden: null },
          { is_hidden: false } as any,
        ],
      };
    }

    const find = await Alias.findByPk(aliasId, { attributes: ["name"] });

    let notes = await Note.findAll({
      where: clause,
      attributes: ["is_hidden", "title", "content", "createdAt", "slug"],
    });
    res.json({
      status: "ok",
      data: {
        alias: { id: aliasId, name: find?.dataValues.name },
        notes: notes ?? [],
      },
    });
  }
);

ApiRoute.post("/note", async (req: Request, res: Response) => {
  const { alias_id, note }: { alias_id: string; note: Partial<INote> } =
    req.body;
  const { content, title, is_hidden, secret, self_destroy_time } = note;
  const authAlias = await isAuthorizedAlias(req, alias_id);

  if (!authAlias) {
    res.status(400).json({
      status: "err",
      message: authErrMsg + ". Authorise your alias to continue",
      error_code: ErrorCodes.UNAUTHORIZED,
    });
    return;
  }

  const valid = validateIncomingNote(note);
  if (!valid.isValid) {
    res.status(400).json({
      status: "err",
      error_code: ErrorCodes.VALIDATION_ERROR,
      message: valid.error,
    });
    return;
  }

  const findAlias = await Alias.findByPk(alias_id);

  if (!findAlias) {
    res.status(400).json({ status: "err", message: "Alias not found" });
    return;
  }

  const slug = generateSlug(title!, 5, is_hidden ?? false);

  const update: any = {
    title,
    content,
    slug,
    alias_id,
  };
  if (self_destroy_time) {
    const time = parseSelfDestroyTimeToDate(self_destroy_time);
    if (!time) {
      res.status(400).json({ status: "err", message: "Invalid time" });
      return;
    }
    update.self_destroy_time = update.will_self_destroy = true;
  }
  if (secret) {
    update.secret = hashSync(secret, 10);
    update.is_hidden = true;
  }

  await Note.create(update);

  res.json({ status: "ok", message: "Note has been saved to your alias!" });
});

server.set("view engine", "ejs");
server.set("views", path.join(__dirname, "views"));

server.use("/public", express.static(path.join(__dirname, "../public")));

server.get("/", (req, res) => {
  res.render("index", {
    title: Brand, // Dynamic title for the page
    publicPath: "/public", // Path to the public directory
  });
});

server.use("/", (req, res) => {
  res.redirect(`/?r=${encodeURIComponent(req.originalUrl)}`);
});

server.listen(4000, () => {
  console.log(`Listening on 4000 ...`);
  connectDb();
});

function generateSlug(
  title: string,
  maxWords: number = 3,
  is_hidden: boolean
): string {
  if (is_hidden) {
    return randomBytes(9).toString("base64url");
  }

  const randomString = Math.random().toString(36).substring(2, 7); // Generate a 5-char random string

  const slug = title
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join("-");

  return `${slug}-${randomString}`;
}

const validTimeRegex =
  /^\d+\s*(second|seconds|minute|minutes|day|days|year|years)$/i;

export function validateSelfDestroyTime(input: string): boolean {
  if (input.split(" ").length !== 2) return false;
  return validTimeRegex.test(input);
}
export function parseSelfDestroyTimeToDate(input: string): Date | boolean {
  if (input.split(" ").length !== 2 || !validTimeRegex.test(input))
    return false;

  const [value, unit] = input.toLowerCase().split(/\s+/); // Split into number and unit
  const num = parseInt(value, 10);
  const now = new Date();

  switch (unit) {
    case "second":
    case "seconds":
      now.setSeconds(now.getSeconds() + num);
      break;
    case "minute":
    case "minutes":
      now.setMinutes(now.getMinutes() + num);
      break;
    case "day":
    case "days":
      now.setDate(now.getDate() + num);
      break;
    case "year":
    case "years":
      now.setFullYear(now.getFullYear() + num);
      break;
  }

  return now;
}
interface IEmailOptions {
  receiver: string;
  subject: string;
  html: string;
}
async function sendEmail(options: IEmailOptions) {
  try {
    const config: any = {
      host: mailConfig.host!,
      port: mailConfig.port!,
      secure: false,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
      connectionTimeout: 60000,
      auth: {
        user: mailConfig.user,
        pass: mailConfig.pass,
      },
    };
    const transporter = createTransport(config);
    const mailOptions = {
      from: `${Brand} <${mailConfig.user}>`,
      to: options.receiver,
      subject: options.subject,
      html: options.html,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(err);
  }
}

async function validateAliasId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const aliasId = req.params.alias_id;
  if (!validate(aliasId)) {
    return res
      .status(400)
      .json({ status: "err", message: "Alias ID is invalid" });
  }
  const find = await Alias.findByPk(aliasId, { attributes: ["id"] });
  if (!find) {
    return res
      .status(400)
      .json({ status: "err", message: "Alias ID is invalid" });
  }

  next();
  return;
}

interface IUserSession {
  expiry: string;
  ip_address: string;
  user_agent: string;
  alias_id: string;
}

async function getSession(req: Request) {
  const sessionId = req.signedCookies[sessionKey];
  const session: IUserSession | null = await memcachedService.get(
    CacheKeys.session(sessionId)
  );

  return session;
}
export function isSessionExpired(expiry: string): boolean {
  const nowUTC = new Date();
  const expiryDate = new Date(expiry);
  return nowUTC > expiryDate;
}
function setExpiryInUTC(hoursToAdd: number): string {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + hoursToAdd);
  return now.toISOString();
}
async function isAuthorizedAlias(req: Request, aliasId: string) {
  const session = await getSession(req);
  if (!session) {
    return false;
  }
  if (session.alias_id !== aliasId) {
    return false;
  }
  if (isSessionExpired(session.expiry)) {
    return false;
  }

  return true;
}
function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  const minLength = 3;
  const maxLength = 20;

  // Check length
  if (username.length < minLength || username.length > maxLength) {
    return {
      isValid: false,
      error: `Username must be between ${minLength} and ${maxLength} characters.`,
    };
  }

  // Check for invalid characters
  const validPattern = /^[a-zA-Z0-9_.]+$/;
  if (!validPattern.test(username)) {
    return {
      isValid: false,
      error:
        "Alias can only contain letters, numbers, underscores, and periods.",
    };
  }

  // Check for special characters at the start or end
  const startsOrEndsWithSpecialChar = /^[_.]|[_.]$/;
  if (startsOrEndsWithSpecialChar.test(username)) {
    return {
      isValid: false,
      error: "Alias cannot start or end with an underscore or period.",
    };
  }

  // Check for consecutive special characters
  const consecutiveSpecialChars = /[_.]{2,}/;
  if (consecutiveSpecialChars.test(username)) {
    return {
      isValid: false,
      error: "Alias cannot contain consecutive underscores or periods.",
    };
  }

  // Check for spaces
  if (/\s/.test(username)) {
    return {
      isValid: false,
      error: "Alias cannot contain spaces.",
    };
  }

  // Optional: Check for restricted words (e.g., profanity)
  const restrictedWords = ["admin", "root", "moderator", Brand.toLowerCase()];
  if (restrictedWords.some((word) => username.toLowerCase().includes(word))) {
    return {
      isValid: false,
      error: "Alias contains restricted words.",
    };
  }

  return { isValid: true };
}

async function validateNoteId(req: Request, res: Response, next: NextFunction) {
  const note_id = req.params["note_id"];
  if (!validate(note_id)) {
    res.status(400).json({ status: "err", message: "Invalid Note" });
    return;
  }
  const count = await Note.count({
    where: { id: note_id },
    attributes: ["alias_id"],
  });

  if (count === 0) {
    res.status(400).json({ status: "err", message: "Note not found" });
    return;
  }
  next();
}

function validateIncomingNote(note: Partial<INote>) {
  const {
    content,
    title,
    is_hidden,
    secret,
    self_destroy_time,
    will_self_destroy,
  } = note;

  if (!title || !content) {
    return { isValid: false, error: "Note must have a title and content" };
  }

  if (is_hidden && !secret) {
    return { isValid: false, error: "Enter a secret for hidden note" };
  }
  if (will_self_destroy && !self_destroy_time) {
    return { isValid: false, error: "Enter a time for note deletion" };
  }

  if (self_destroy_time) {
    const valid = validateSelfDestroyTime(self_destroy_time);
    if (!valid) {
      return {
        isValid: false,
        error: "Invalid timer. Please follow the format: <number> <unit>.",
      };
    }
  }

  return { isValid: true };
}

async function deleteExpiredNotes() {
  const now = new Date();
  try {
    // Find and delete all notes marked for self-destruction
    const deletedCount = await Note.destroy({
      where: {
        will_self_destroy: true,
        self_destroy_time: {
          [Op.lte]: now, // Notes where autoDeleteAt <= current time
        },
      },
    });
    console.log(`${deletedCount} expired notes deleted.`);
  } catch (error) {
    console.error("Error deleting expired notes:", error);
  }
}

cron.schedule("* * * * *", async () => {
  await deleteExpiredNotes(); // Runs every minute
});
