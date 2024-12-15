import express, { Request, Response } from "express";
import path from "path";
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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/public", express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.render("index", {
    title: "Notes space", // Dynamic title for the page
    publicPath: "/public", // Path to the public directory
  });
});

app.post("/a", (req: Request, res: Response) => {});

app.listen(4000, () => {
  console.log(`Listening on 4000 ...`);
});
