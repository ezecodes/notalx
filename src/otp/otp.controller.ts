import { CookieOptions, NextFunction, Request, Response } from "express";
import {
  ApiError,
  getRandomInt,
  getSessionFromReq,
  isExpired,
  isValidEmail,
  sendEmail,
  setExpiryInUTC,
} from "../helpers";
import { ErrorCodes, IAuthSession, IOtpSession, IUser } from "../type";
import User from "../user/user.model";
import { compare, hashSync } from "bcrypt";
import { randomBytes } from "crypto";
import memcachedService from "../memcached";
import { CacheKeys, otpSessionCookieKey, sessionCookieKey } from "../constants";

export async function requestOtp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    next(
      ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Provide a valid email")
    );

    return;
  }

  const user = (await User.findOne({
    where: { email },
    raw: true,
  })) as any as IUser;

  if (!user) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Email is invalid"));

    return;
  }
  const code = getRandomInt().toString();
  const auth_code_hash = hashSync(code, 10);
  console.log(code);

  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 30);

  const otpSessionSlug = randomBytes(20).toString("base64url");

  const cookieOpts: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1440 * 60 * 1000, // 60 minutes
    signed: true,
  };

  const cache: IOtpSession = {
    email,
    expiry,
    auth_code_hash,
  };
  memcachedService.set(CacheKeys.otp(otpSessionSlug), cache, 3600);

  sendEmail({
    html: `Your code ${code}`,
    receiver: user.email,
    subject: "Your OTP",
  });
  res.cookie(otpSessionCookieKey, otpSessionSlug, cookieOpts);

  res.json({ status: "ok", message: "OTP sent to email" });
}

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { email, code } = req.body;
  if (!email || !isValidEmail(email) || !code) {
    next(
      ApiError.error(
        ErrorCodes.RESOURCE_NOT_FOUND,
        "Please ensure that both Email and OTP code are provided in the request"
      )
    );
    return;
  }
  const sessionSlug = req.signedCookies[otpSessionCookieKey];

  if (!sessionSlug) {
    next(
      ApiError.error(ErrorCodes.UNAUTHORIZED, "OTP session expired or invalid")
    );
    return;
  }
  const cachedSession: IOtpSession | null = await memcachedService.get(
    CacheKeys.otp(sessionSlug)
  );
  if (!cachedSession) {
    next(
      ApiError.error(ErrorCodes.UNAUTHORIZED, "OTP session expired or invalid")
    );
    return;
  }

  const valid = await compare(code.toString(), cachedSession.auth_code_hash);
  if (email !== cachedSession.email || !valid) {
    next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Invalid Otp code"));
    return;
  }
  const expiry = setExpiryInUTC(24);

  if (isExpired(cachedSession.expiry as string)) {
    next(
      ApiError.error(ErrorCodes.UNAUTHORIZED, "OTP session expired or invalid")
    );
    return;
  }

  const user = (await User.findOne({
    where: { email },
    raw: true,
  })) as any as IUser;

  const sessionObj: IAuthSession = {
    expiry,
    ip_address:
      req.headers["x-forwarded-for"]! || req.connection.remoteAddress!,
    user_agent: req.headers["user-agent"]!,
    user_id: user.id,
    socket_auth_hash: hashSync(user.id, 5),
  };
  const authSessionId = randomBytes(15).toString("base64url");

  memcachedService.set(
    CacheKeys.authSession(authSessionId),
    sessionObj,
    24 * 60 * 60
  );
  memcachedService.delete(CacheKeys.otp(user!.email));

  const cookieOpts: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    signed: true,
  };

  res.cookie(sessionCookieKey, authSessionId, cookieOpts);

  res.json({ status: "ok", message: "OTP verified" });
}

export async function invalidateOtp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.signedCookies[sessionCookieKey];

  memcachedService.delete(CacheKeys.authSession(sessionId));
  res.clearCookie(sessionCookieKey);
  res.json({ status: "ok", message: "OTP invalidated" });
}

export async function getOtpExpiration(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = await getSessionFromReq(req);
  if (!session) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid session"));
    return;
  }
  const find = await User.findByPkWithCache(session.user_id);
  res.json({
    status: "ok",
    message: "OTP expiration retrieved",
    data: {
      expiry: session.expiry,
      user_id: session.user_id,
      name: find?.name,
      is_valid_auth: isExpired(session.expiry) ? false : true,
    },
  });
}
