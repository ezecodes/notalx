import { NextFunction, Request, Response } from "express";
import Note from "./models/Note";
import { ErrorCodes, IAuthSession } from "./type";
import { CacheKeys, sessionCookieKey } from "./constants";
import memcachedService from "./memcached";
import {
  ApiError,
  isExpired,
  PopulateNoteCollaborators,
  PopulateTaskParticipants,
} from "./helpers";
import Alias from "./models/Alias";
import { validate } from "uuid";
import Task from "./models/Task";
import { ExtendedError, Socket } from "socket.io";
import cookie, { parse } from "cookie";
import Category from "./models/Category";
import Template from "./models/Template";
import { z } from "zod";
import { signedCookies } from "cookie-parser";

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
export async function validateAliasId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const aliasId = req.params.alias_id;
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
        "Your session has expired. Please verify your OTP to continue."
      )
    );
    return;
  }

  req.__alias = { id: cachedSession.alias_id };
  next();
}
export async function authorize_alias_as_task_owner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const find = await Task.findByPkWithCache(req.params.task_id);

  if (!find || find.alias_id !== req.__alias?.id) {
    next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Owner access required"));
    return;
  }

  next();
}

export async function authoriseAliasIoConnection(
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

  (socket as any).__alias = { id: cachedSession.alias_id }; // Attach user info to the socket object
  next();
}

export async function authorize_alias_as_task_participant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const task = await Task.findByPkWithCache(req.params.task_id);
  const participants = await PopulateTaskParticipants(
    req.params.task_id,
    task?.alias_id!
  );
  if (
    participants.length === 0 ||
    !participants.find((i) => i?.id === req.__alias?.id)
  ) {
    next(
      ApiError.error(ErrorCodes.UNAUTHORIZED, "Participant access required")
    );
    return;
  }
  next();
}

export async function authorize_alias_as_note_collaborator(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
export async function authorize_alias_as_note_owner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const find = await Note.findByPkWithCache(req.params.note_id);

  if (!find || find.alias_id !== req.__alias?.id) {
    next(ApiError.error(ErrorCodes.UNAUTHORIZED, "Owner access required"));
    return;
  }

  next();
}
export async function validateTaskId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const task_id = req.params["task_id"];
  if (!validate(task_id)) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid Task ID"));
    return;
  }
  const count = await Task.count({
    where: { id: task_id },
  });

  if (count === 0) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Task not found"));

    return;
  }
  next();
}
export async function validateCategoryId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const category_id = req.params["category_id"];
  if (!validate(category_id)) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid Category ID"));
    return;
  }
  const count = await Category.count({
    where: { id: category_id },
  });

  if (count === 0) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Category not found"));

    return;
  }
  next();
}
export async function validateTemplateId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const template_id = req.params["template_id"];
  if (!validate(template_id)) {
    next(ApiError.error(ErrorCodes.VALIDATION_ERROR, "Invalid Template ID"));
    return;
  }
  const count = await Template.count({
    where: { id: template_id },
  });

  if (count === 0) {
    next(ApiError.error(ErrorCodes.RESOURCE_NOT_FOUND, "Template not found"));

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
