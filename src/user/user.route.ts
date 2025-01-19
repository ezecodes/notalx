import { Router } from "express";
import { catchAsync } from "../helpers";
import * as UserController from "./user.controller";

const router = Router();

router.post("/", catchAsync(UserController.registerUser));

export default router;
