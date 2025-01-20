import { Router } from "express";
import { catchAsync } from "../helpers";
import * as UserController from "./user.controller";
import { validateAndSetPagination } from "../middlewares";

const router = Router();

router
  .route("/")
  .post(catchAsync(UserController.registerUser))
  .get(validateAndSetPagination, catchAsync(UserController.findUser));

export default router;
