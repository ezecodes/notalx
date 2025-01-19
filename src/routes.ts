import { Router } from "express";
import userRouter from "./user/user.route";
import noteRouter from "./note/note.route";
import otpRouter from "./otp/otp.route";

const router = Router();

router.use("/user", userRouter);
router.use("/note", noteRouter);
router.use("/otp", otpRouter);

export default router;
