import { Router } from "express";
import * as OtpController from "./otp.controller";

const router = Router();

router.post("/send", OtpController.requestOtp);
router.post("/verify", OtpController.verifyOtp);
router.delete("/invalidate", OtpController.invalidateOtp);
router.get("/expiry", OtpController.getOtpExpiration);

export default router;
