import express, { Request, Response } from "express";
import path from "path";
import Alias from "./models/Alias";
import Note from "./models/Note";
import { IApiResponse, ICreateAlias, ICreateNote } from "./type";
import { connectDb } from "./sequelize";
import { hashSync } from "bcrypt";
import morgan from "morgan";
import { Op } from "sequelize";
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

server.get("/alias", async (req: Request, res: Response) => {
  const all = await Alias.findAll({ where: {}, attributes: ["id", "name"] });
  res.json({ status: "ok", data: { rows: all } });
});

server.get("/alias/search", async (req: Request, res: Response) => {
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

server.post("/alias", async (req: Request, res: Response) => {
  const body: ICreateAlias = req.body;
  const { name, email, secret } = body;

  const count = await Alias.count({ where: { name } });
  if (count > 0) {
    res.json({ status: "err", message: "Alias alredy exisits" });
    return;
  }

  const hashedSecret = secret ? await hashSync(secret, 10) : null;

  Alias.create({ name, email, secret: hashedSecret });
  res.json({ status: "ok" });
});

server.get("/alias/:alias_id", async (req: Request, res: Response) => {
  const aliasId = req.params.alias_id;

  const all = await Alias.findByPk(aliasId, {
    attributes: ["id", "name"],
  });
  res.json({ status: "ok", data: { rows: all } });
});

server.get("/note", async (req: Request, res: Response) => {
  const all = await Note.findAll({ where: { hidden: false } });
  res.json({ status: "ok", data: { rows: all } });
});

server.get("/note/:note_id", async (req: Request, res: Response) => {
  const noteId = req.params.note_id;

  const data = await Note.findByPk(noteId, {
    attributes: ["title", "content"],
  });
  res.json({ status: "ok", data });
});
server.get("/note/alias/:alias_id", async (req: Request, res: Response) => {
  const aliasId = req.params.alias_id;

  const all = await Note.findAll({
    where: {
      alias_id: aliasId,
      [Op.or]: [{ hidden: false }, { hidden: null }],
    },
  });
  res.json({ status: "ok", data: { rows: all ?? [] } });
});
server.post("/note", async (req: Request, res: Response) => {
  const { alias_id, content, hidden, secret, title }: ICreateNote = req.body;
  console.log(req.body);

  const findAlias = await Alias.findByPk(alias_id);
  if (hidden && (!findAlias?.secret || !secret)) {
    res.json({ status: "err", message: "Enter a secret to continue" });
    return;
  }

  if (!findAlias) {
    res.json({ status: "err", message: "Alias not found" });
    return;
  }
  await Note.create({ title, content, alias_id });

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

server.listen(4000, () => {
  console.log(`Listening on 4000 ...`);
  connectDb();
});
