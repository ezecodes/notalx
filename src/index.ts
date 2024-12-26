import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { ErrorCodes } from "./type";
import { connectDb } from "./sequelize";
import morgan from "morgan";
import cron from "node-cron";

import cookieParser from "cookie-parser";
import { ApiError, deleteExpiredNotes } from "./helpers";
import { Branding_NotalX } from "./constants";
import router from "./routes";

const reactRoutes = [
  "/newnote",
  "/newalias",
  "/edit/:note_slug",
  "/auth-with-alias",
  "/:note_slug",
  "/faq",
];
const server = express();

server.use(cookieParser(process.env.COOKIE_SECRET));
server.use(express.json({ limit: "5mb" }));
server.use(express.urlencoded({ extended: false }));
server.use(morgan("tiny"));

server.use("/api", router);

server.set("view engine", "ejs");
server.set("views", path.join(__dirname, "views"));

server.use("/public", express.static(path.join(__dirname, "../public")));

server.get("/", (req, res) => {
  res.render("index", {
    title: Branding_NotalX.name, // Dynamic title for the page
    publicPath: "/public", // Path to the public directory
  });
});
reactRoutes.forEach((route) => {
  server.get(route, (req, res) => {
    res.redirect(`/?r=${encodeURIComponent(req.originalUrl)}`);
  });
});
server.use(function (_req, res, next) {
  next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Route not found"));
});
server.use(function (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const error_code = err.error_code ?? ErrorCodes.INTERNAL_SERVER_ERROR;
  const status_code = err.status_code ?? 500;
  const message = err.message ?? "An error occurred";

  if (process.env.NODE_ENV === "production") {
    // Send error to an external logging service like Sentry
    // Sentry.captureException(err);
  } else {
    if (error_code === ErrorCodes.INTERNAL_SERVER_ERROR) {
      console.error(`[CRITICAL ERROR] ${err.message}`, {
        stack: err.stack,
      });
    } else {
      // console.warn(`[Warning] ${err.message}`, { stack: err.stack });
    }
  }

  res.status(status_code).json({ status: "err", message, error_code });
});

server.listen(4000, () => {
  console.log(`Listening on 4000 ...`);
  connectDb();
});

cron.schedule("* * * * *", async () => {
  await deleteExpiredNotes(); // Runs every minute
});
