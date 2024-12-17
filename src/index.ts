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
import { IAlias, IApiResponse, INote } from "./type";
import { connectDb } from "./sequelize";
import { compareSync, hashSync } from "bcrypt";
import morgan from "morgan";
import { Op } from "sequelize";
import { randomBytes } from "crypto";
import { validate } from "uuid";
import { createTransport } from "nodemailer";

import dotenv from "dotenv";
import Session from "./models/Session";
import cookieParser from "cookie-parser";
import memcachedService from "./memcache";
dotenv.config();

const server = express();
const sessionKey = "s-tkn";
const Brand = "Hush thoughts";

const mailConfig = {
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASSWORD,
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
};

declare module "express" {
  interface Response {
    json<DataType = any>(body: IApiResponse<DataType>): this;
  }
}
declare global {
  namespace Express {
    export interface Request {
      alias?: {
        isCorrectSecret: boolean;
      };
    }
  }
}
const validateAliasId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};

const isAuthenticated = async (req: Request) => {
  const sessionId = req.signedCookies[sessionKey];
  const aliasId = req.params.alias_id;
  if (!sessionId) {
    return false;
  }

  const session = await Session.findByPk(sessionId);
  if (!session) {
    return false;
  }
  if (session.dataValues.expiry < new Date()) {
    return false;
  }

  if (session.dataValues.alias_id !== aliasId) {
    return false;
  }

  return true;
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
ApiRoute.post("/otp/send", async (req: Request, res: Response) => {
  const { email, alias_id } = req.body;
  const user = await Alias.findOne({
    where: { email, id: alias_id },
    attributes: ["id", "name"],
  });

  if (!user) {
    res.json({
      status: "err",
      message: "Email and alias combination is not valid",
    });
    return;
  }

  const code = randomBytes(2).toString("hex");

  memcachedService.set(`opt:${email}`, hashSync(code, 10), 3600);

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

  const otp = await memcachedService.get(`otp:${email}`);

  if (!otp) {
    res.status(400).json({ status: "err", message: "Invalid Otp code" });
    return;
  }

  const valid = compareSync(code, otp as string);
  if (!valid) {
    res.status(400).json({ status: "err", message: "Invalid Otp code" });
    return;
  }
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);

  const sessionObj = {
    expiry,
    ip_address:
      req.headers["x-forwarded-for"]! || req.connection.remoteAddress!,
    user_agent: req.headers["user-agent"]!,
    alias_id: user.dataValues.id!,
  };
  const id = randomBytes(10).toString("hex");

  memcachedService.set(id, sessionObj, 3600);

  const cookieOpts: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 60 minutes
    signed: true,
  };

  res.cookie(sessionKey, id, cookieOpts);

  res.json({ status: "ok", message: "OTP sent to email" });
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

ApiRoute.post("/alias", async (req: Request, res: Response) => {
  const body: Partial<IAlias> = req.body;
  const { name, email } = body;
  if (!name || !email) {
    res.json({
      status: "err",
      message: "Alias must have a name an a recovery email",
    });
    return;
  }
  const count = await Alias.count({ where: { name } });
  if (count > 0) {
    res.json({ status: "err", message: "Alias already exists" });
    return;
  }

  Alias.create({ name, email: (email as string) ?? null });
  res.json({ status: "ok", message: "Alias created!" });
});

ApiRoute.get("/alias/:alias_id", async (req: Request, res: Response) => {
  // const aliasId = req.params.alias_id;
  // const data = await Alias.findByPk(aliasId, {
  //   attributes: ["id", "name", "secret"],
  // });
  // res.json({ status: "ok", data: {} });
});

ApiRoute.get("/note", async (req: Request, res: Response) => {
  const all = await Note.findAll({ where: { is_hidden: false } });
  res.json({ status: "ok", data: { rows: all } });
});

ApiRoute.get("/note/:note_slug", async (req: Request, res: Response) => {
  const slug = req.params.note_slug;
  const isAuth = isAuthenticated(req);
  const authHeader = req.headers.authorization;
  const secret = authHeader?.split(" ")[1];

  const find = await Note.findOne({
    where: { slug },
    attributes: [
      "title",
      "secret",
      "slug",
      "is_hidden",
      "content",
      "createdAt",
    ],
  });
  if (!find) {
    res.status(400).json({ status: "err", message: "Note not found" });
    return;
  }
  if (find?.dataValues.is_hidden) {
    if (authHeader && secret) {
      const valid = compareSync(secret, find?.dataValues.secret);
      if (!valid) {
        res
          .status(400)
          .json({ status: "err", message: "Action not permitted" });
        return;
      }
    }
    if (!isAuth) {
      res.status(400).json({ status: "err", message: "Action not permitted" });
      return;
    }
  }

  res.json({
    status: "ok",
    message: "Note retrived",
    data: {
      title: find?.dataValues.title,
      content: find?.dataValues.content,
      createdAt: find?.dataValues.createdAt,
      slug: find?.dataValues.slug,
    },
  });
});
ApiRoute.get(
  "/note/alias/:alias_id",
  validateAliasId as any,
  async (req: Request, res: Response) => {
    const aliasId = req.params.alias_id;
    const isAuth = isAuthenticated(req);

    let clause: any = { alias_id: aliasId };
    if (!isAuth) {
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

    const all = await Note.findAll({
      where: clause,
      attributes: ["title", "content", "createdAt", "slug"],
    });
    res.json({ status: "ok", data: { rows: all ?? [] } });
  }
);

ApiRoute.post("/note", async (req: Request, res: Response) => {
  const { alias_id, note }: { alias_id: string; note: Partial<INote> } =
    req.body;
  const {
    content,
    title,
    is_hidden,
    secret,
    self_destroy_time,
    will_self_destroy,
  } = note;

  if (!title || !content) {
    res.json({ status: "err", message: "Note must have a title and content" });
    return;
  }

  if (is_hidden && !secret) {
    res.json({ status: "err", message: "Enter a secret for hidden note" });
    return;
  }
  if (will_self_destroy && !self_destroy_time) {
    res.json({ status: "err", message: "Enter a time for note deletion" });
    return;
  }

  if (self_destroy_time) {
    const valid = validateSelfDestroyTime(self_destroy_time);
    if (!valid) {
      res.json({
        status: "err",
        message: "Invalid timer. Please follow the format: <number> <unit>.",
      });
      return;
    }
  }
  const findAlias = await Alias.findByPk(alias_id);

  if (!findAlias) {
    res.json({ status: "err", message: "Alias not found" });
    return;
  }
  const slug = generateSlug(title, 5, is_hidden ?? false);

  const update: any = {
    title,
    content,
    slug,
    alias_id,
  };
  if (self_destroy_time) {
    update.self_destroy_time = parseSelfDestroyTimeToDate(self_destroy_time);
    update.will_self_destroy = true;
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
server.get("/edit", (req, res) => {
  res.redirect(`/?r=${encodeURIComponent(req.originalUrl)}`);
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
    return randomBytes(3).toString("base64url");
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
  return validTimeRegex.test(input);
}
export function parseSelfDestroyTimeToDate(input: string): Date | null {
  if (!validateSelfDestroyTime(input)) {
    return null; // Invalid input
  }

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
    default:
      return null; // Invalid unit (shouldn't happen due to regex)
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
