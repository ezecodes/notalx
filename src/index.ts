import express, { Request, Response } from "express";
import path from "path";
import Alias from "./models/Alias";
import Note from "./models/Note";
import { ICreateNote } from "./type";
const app = express();

type IApiResponse<T> = {
  status: "ok" | "err";
  data?: T;
  message?: string;
  errors?: { field: string; code: string; message?: string }[];
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
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/public", express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.render("index", {
    title: "Notes space", // Dynamic title for the page
    publicPath: "/public", // Path to the public directory
  });
});

app.get("/alias", async (req: Request, res: Response) => {
  const all = await Alias.findAll({ where: {}, attributes: ["id", "name"] });
  res.json({ status: "ok", data: { rows: all } });
});

app.get("/alias/:name", async (req: Request, res: Response) => {
  const name = req.params.name;
  const isAuth = req.alias?.isCorrectSecret;

  const noteAttrs = ["id", "title", "content", "hidden"];

  const all = await Alias.findOne({
    where: { name },
    attributes: ["id", "name"],
    include: {
      model: Note,
      attributes: ["id"],
    },
  });
  res.json({ status: "ok", data: { rows: all } });
});

app.get("/note/:alias_id", async (req: Request, res: Response) => {
  const aliasId = req.params.alias_id;

  const all = await Note.findAll({
    where: { alias_id: aliasId, hidden: false },
  });
  res.json({ status: "ok", data: { rows: all } });
});

app.get("/note", async (req: Request, res: Response) => {
  const all = await Note.findAll({ where: { hidden: false } });
  res.json({ status: "ok", data: { rows: all } });
});

app.post("/note", async (req: Request, res: Response) => {
  const { alias, note }: ICreateNote = req.body;
  const { name, secret } = alias;
  const { title, content, hidden } = note;

  const findAlias = await Alias.findOne({ where: { name } });
  if (hidden && (!findAlias?.password || !secret)) {
    res.json({ status: "err", message: "Enter a secret to continue" });
  }
  if (!findAlias) {
    const newAlias = await Alias.create(
      { name, password: secret ?? null },
      { returning: true }
    );
    await Note.create({ title, content, alias_id: newAlias.id });
  } else {
    await Note.create({ title, content, alias_id: findAlias.id });
  }

  res.json({ status: "ok", message: "Note has been saved to your alias!" });
});

app.listen(4000, () => {
  console.log(`Listening on 4000 ...`);
});
