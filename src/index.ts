import express, { Request, Response, Router } from "express";
import path from "path";
import Alias from "./models/Alias";
import Note from "./models/Note";
import { IAlias, IApiResponse, INote } from "./type";
import { connectDb } from "./sequelize";
import { hashSync } from "bcrypt";
import morgan from "morgan";
import { Op } from "sequelize";
import { randomBytes } from "crypto";
const server = express();

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

server.use(express.json({ limit: "5mb" }));
server.use(express.urlencoded({ extended: false }));
server.use(morgan("tiny"));

const ApiRoute = Router();
server.use("/api", ApiRoute);

ApiRoute.get("/alias", async (req: Request, res: Response) => {
  const all = await Alias.findAll({ where: {}, attributes: ["id", "name"] });
  res.json({ status: "ok", data: { rows: all } });
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
  if (!name) {
    res.json({ status: "err", message: "Alias must have a name" });
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

  const data = await Note.findOne({
    where: { slug },
    attributes: ["title", "content", "id", "createdAt", "updatedAt"],
  });
  res.json({ status: "ok", data });
});
ApiRoute.get("/note/alias/:alias_id", async (req: Request, res: Response) => {
  const aliasId = req.params.alias_id;

  const all = await Note.findAll({
    where: {
      alias_id: aliasId,
      [Op.or]: [{ is_hidden: false }, { is_hidden: null } as any],
    },
  });
  res.json({ status: "ok", data: { rows: all ?? [] } });
});
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
    title: "Hushboard", // Dynamic title for the page
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
