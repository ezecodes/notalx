import { NextFunction, Request, Response } from "express";
import Note from "./models/Note";
import { ErrorCodes, IAuthSession, IPagination } from "./type";
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
import Job from "./job/job.model";
import cookie from "cookie";

export function validateAndSetPagination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { page, page_size } = req.query as any;

  const parsedPage = isNaN(page) && page > 0 ? page : 1;
  const parsedPageSize = !isNaN(page_size) && page_size > 0 ? page_size : 10;

  req.__pagination__ = {
    page: parsedPage,
    page_size: parsedPageSize,
    offset: (parsedPage - 1) * parsedPageSize,
  };

  next();
}
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
async function getCachedSession(sessionId: string | undefined) {
  if (!sessionId) return null;
  const cachedSession: IAuthSession | null = await memcachedService.get(
    CacheKeys.authSession(sessionId)
  );
  return cachedSession && !isExpired(cachedSession.expiry as string)
    ? cachedSession
    : null;
}

export async function authoriseAlias(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.signedCookies[sessionCookieKey];
  const cachedSession = await getCachedSession(sessionId);

  if (!cachedSession) {
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

// export async function authoriseAliasIoConnection(
//   socket: Socket,
//   next: (err?: ExtendedError) => void
// ) {
//   const cookies = socket.handshake.headers.cookie;

//   if (!cookies) {
//     return next(new Error("Authentication error"));
//   }

//   const parsedCookies = cookie.parse(cookies);
//   const sessionId = parsedCookies[sessionCookieKey];
//   const cachedSession = await getCachedSession(sessionId);

//   if (!cachedSession) {
//     next(
//       ApiError.error(
//         ErrorCodes.UNAUTHORIZED,
//         "Auth session expired. Verify OTP to continue"
//       )
//     );
//     return;
//   }

//   (socket as any).__alias = { id: cachedSession.alias_id }; // Attach user info to the socket object
//   next();
// }
export async function authoriseAliasToViewNote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const note_id = req.params.note_id;
  const secret = req.get("Authorization");

  const find = await Note.findByPk(note_id, {
    attributes: ["is_hidden", "alias_id", "secret", "id"],
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
    if (alias_is_auth) {
      req.__note = { id: find.dataValues.id! };
      next();
      return;
    } else {
      if (!secret || secret.trim() === "") {
        next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Action not permitted"));
        return;
      }
      const compare = compareSync(secret, find.dataValues.secret);
      if (!compare) {
        next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Action not permitted"));
        return;
      } else {
        req.__note = { id: find.dataValues.id! };
        next();
        return;
      }
    }
  } else {
    req.__note = { id: find.dataValues.id! };
    next();
  }
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

export async function validateJobId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const job_id = req.params["job_id"];
  if (!validate(job_id)) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid Job ID"));
    return;
  }
  const count = await Job.count({
    where: { id: job_id },
  });

  if (count === 0) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Job not found"));

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
