import { NextFunction, Request, Response } from "express";
import { ErrorCodes, IAuthSession, ICollaboratorPermission } from "./type";
import { CacheKeys, sessionCookieKey } from "./constants";
import memcachedService from "./memcached";
import { ApiError, isExpired } from "./helpers";
import { validate } from "uuid";
import { ExtendedError, Socket } from "socket.io";
import { parse } from "cookie";
import { z } from "zod";
import { signedCookies } from "cookie-parser";
import User from "./user/user.model";
import Note from "./note/note.model";
import Collaborator from "./collaborator/collaborator.model";

export function validateRequestBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (result.success) next();
    else {
      const errors = result.error.errors.map((issue) => ({
        field: issue.path.join("."), // Join path for nested fields
        code: ErrorCodes.VALIDATION_ERROR,
        message: issue.message, // Custom error message
      }));
      res.status(400).json({
        status: "err",
        error_code: ErrorCodes.VALIDATION_ERROR,
        message: errors[0].message,
      });
      return;
    }
  };
}
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
export async function validateUserId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.params.user_id;
  if (!validate(userId)) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "User ID is invalid"));
    return;
  }
  const find = await User.findByPkWithCache(userId);
  if (!find) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "User ID not found"));
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

export async function authoriseUser(
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
        "Your session has expired. Please verify your OTP to continue."
      )
    );
    return;
  }

  req.__user__ = { id: cachedSession.user_id };
  next();
}
// export async function authorize_user_as_task_owner(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   const find = await Task.findByPkWithCache(req.params.task_id);

//   if (!find || find.user_id !== req.__user__?.id) {
//     next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Owner access required"));
//     return;
//   }

//   next();
// }

export async function authoriseUserIoConnection(
  socket: Socket,
  next: (err?: ExtendedError) => void
) {
  const cookies = socket.handshake.headers.cookie;

  if (!cookies) {
    return next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Login to continue"));
  }

  const parsedCookies = parse(cookies);
  const unsignedCookies = signedCookies(
    parsedCookies as any,
    process.env.COOKIE_SECRET!
  );

  const sessionId = unsignedCookies[sessionCookieKey];
  const cachedSession = await getCachedSession(sessionId as string);

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

  (socket as any).__user__ = { id: cachedSession.user_id }; // Attach user info to the socket object
  next();
}

// export async function authorize_user_as_task_participant(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   const task = await Task.findByPkWithCache(req.params.task_id);
//   const participants = await PopulateTaskParticipants(
//     req.params.task_id,
//     task?.user_id!
//   );
//   if (
//     participants.length === 0 ||
//     !participants.find((i: { id: string | undefined; }) => i?.id === req.__user__?.id)
//   ) {
//     next(
//       ApiError.error(ErrorCodes.UNAUTHORIZED, "Participant access required")
//     );
//     return;
//   }
//   next();
// }

export function authorize_user_as_note_collaborator(
  permission: ICollaboratorPermission
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const collaborators = await Collaborator.getCollaboratorsForNote(
      req.params.note_id
    );
    const find = collaborators.find((i) => i?.user_id === req.__user__!.id);
    if (!find) {
      next(
        ApiError.error(ErrorCodes.UNAUTHORIZED, "Collaborator access required")
      );
      return;
    }
    const PermissionHierarchy = ["read", "write"];
    const incomingPermissionHierarchy = PermissionHierarchy.findIndex(
      (i) => i === permission
    );
    const existingPermissionHierarchy = PermissionHierarchy.findIndex(
      (i) => i === find.permission
    );
    if (existingPermissionHierarchy < incomingPermissionHierarchy) {
      next(
        ApiError.error(
          ErrorCodes.UNAUTHORIZED,
          `Permission required to ${permission} to note`
        )
      );
      return;
    }
    req.__collaborator_permission__ = {
      existingPermissionHierarchy,
      incomingPermissionHierarchy,
    };

    next();
  };
}
export async function authorize_user_as_note_owner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const find = await Note.findByPkWithCache(req.params.note_id);

  if (!find || find.owner_id !== req.__user__?.id) {
    next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Owner access required"));
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
