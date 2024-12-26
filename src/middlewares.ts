import { NextFunction, Request, Response } from "express";
import Note from "./models/Note";
import { ErrorCodes, IAuthSession } from "./type";
import { CacheKeys, sessionCookieKey } from "./constants";
import memcachedService from "./memcached";
import { ApiError, isExpired } from "./helpers";
import Alias from "./models/Alias";
import { validate } from "uuid";

export async function validateAliasId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const aliasId = req.params.alias_id;
  console.log(req.params);
  if (!validate(aliasId)) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Alias ID is invalid"));
    return;
  }
  const find = await Alias.findByPk(aliasId, { attributes: ["id"] });
  if (!find) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Alias ID not found"));
    return;
  }

  next();
}
export async function authoriseAlias(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.signedCookies[sessionCookieKey];

  const cachedSession: IAuthSession | null = await memcachedService.get(
    CacheKeys.authSession(sessionId)
  );

  if (
    !sessionId ||
    !cachedSession ||
    isExpired(cachedSession.expiry as string)
  ) {
    next(
      ApiError.error(
        ErrorCodes.UNAUTHORIZED,
        "Auth session expired. Verify OTP to continue"
      )
    );
    return;
  }

  req.alias = { id: cachedSession.alias_id };
  next();
}

export async function authoriseAliasForNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const find = await Note.findOne({
    where: { alias_id: req.alias!.id, id: req.params.note_id },
  });

  if (!find) {
    next(ApiError.error(ErrorCodes.FORBIDDEN, "Action not permitted"));
    return;
  }

  next();
}

export async function validateNoteId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params["note_id"];
  if (!validate(note_id)) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid Note ID"));
    return;
  }
  const count = await Note.count({
    where: { id: note_id },
  });

  if (count === 0) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Note not found"));

    return;
  }
  next();
}
