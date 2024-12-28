import { NextFunction, Request, Response } from "express";
import Note from "./models/Note";
import { ErrorCodes, IAuthSession } from "./type";
import { CacheKeys, sessionCookieKey } from "./constants";
import memcachedService from "./memcached";
import {
  ApiError,
  Is_Alias_In_Session_Same_As_Alias,
  isExpired,
  PopulateNoteCollaborators,
} from "./helpers";
import Alias from "./models/Alias";
import { validate } from "uuid";
import { compareSync } from "bcrypt";

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
  const find = await Alias.findByPkWithCache(aliasId);
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

  req.__alias = { id: cachedSession.alias_id };
  next();
}

export async function authoriseAliasToViewNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const slug = req.params.note_id; // Here note_id in route params reps the slug for getting notes

  const secret = req.get("Authorization");

  const find = await Note.findOne({
    where: { slug },
    attributes: ["is_hidden", "alias_id", "secret"],
  });

  if (!find) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Note not found"));
    return;
  }

  if (find?.dataValues.is_hidden) {
    const alias_is_auth = await Is_Alias_In_Session_Same_As_Alias(
      req,
      find.dataValues.alias_id
    );
    if (!alias_is_auth || !secret) {
      next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Action not permitted"));
      return;
    }
    const compare = compareSync(secret, find.dataValues.secret);
    if (!compare) {
      next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Action not permitted"));
      return;
    }
  }
  next();
}

export async function authoriseAliasForNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const find = await Note.findByPkWithCache(req.params.note_id);

  if (find && find.alias_id === req.__alias?.id) {
    next();
    return;
  }
  const collaborators = await PopulateNoteCollaborators(req.params.note_id);
  if (
    collaborators.length === 0 ||
    !collaborators.find((i) => i?.id === req.__alias?.id)
  ) {
    next(
      ApiError.error(ErrorCodes.UNAUTHORIZED, "Collaborator access required")
    );
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
