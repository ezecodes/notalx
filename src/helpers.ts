import { Op } from "sequelize";
import Note from "./models/Note";
import {
  _IAlias,
  ErrorCodes,
  ICloudflareResponse,
  IncomingNote,
  INote,
  INoteCollaborator,
  ITask,
  NotificationType,
} from "./type";
import { randomBytes } from "crypto";
import {
  Branding_NotalX,
  CacheKeys,
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ID,
  mailConfig,
  RESTRICTED_WORDS,
  sessionCookieKey,
  X_API_KEY,
} from "./constants";
import { createTransport } from "nodemailer";
import { NextFunction, Request, Response } from "express";
import memcachedService from "./memcached";
import NoteCollaborator from "./models/NoteCollaborator";
import Alias from "./models/Alias";
import { hashSync } from "bcrypt";
import OpenAI from "openai";
import { ChatCompletionMessage } from "openai/resources";
import TaskParticipant from "./models/TaskParticipant";
import { isProfane } from "no-profanity";
import Notification from "./models/Notification";

export const getRandomInt = (min = 100_000, max = 900_000) => {
  return Math.floor(Math.random() * (max - min) + min);
};

export function generateSlug(title: string, maxWords: number = 3): string {
  const randomString = Math.random().toString(36).substring(2, 7); // Generate a 5-char random string

  const slug = title
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join("-");

  return `${slug}-${randomString}`;
}

const validTimeRegex =
  /^\d+\s*(second|seconds|minute|minutes|hour|hours|day|days|year|years)$/i;

export function validateLiteralTime(input: string): boolean {
  if (input.split(" ").length !== 2) return false;
  return validTimeRegex.test(input);
}
export function parseLiteralTime(input: string): Date | boolean {
  if (input.split(" ").length !== 2 || !validTimeRegex.test(input))
    return false;

  const [value, unit] = input.toLowerCase().split(/\s+/); // Split into number and unit
  const num = parseInt(value, 10);
  const now = new Date();

  switch (unit) {
    case "second":
    case "seconds":
      now.setSeconds(now.getSeconds() + num);
      break;
    case "minute":
    case "minutes":
      now.setMinutes(now.getMinutes() + num);
      break;
    case "hour":
    case "hours":
      now.setHours(now.getHours() + num);
      break;
    case "day":
    case "days":
      now.setDate(now.getDate() + num);
      break;
    case "year":
    case "years":
      now.setFullYear(now.getFullYear() + num);
      break;
  }

  return now;
}
interface IEmailOptions {
  receiver: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: IEmailOptions) {
  try {
    const config: any = {
      host: mailConfig.host!,
      port: mailConfig.port!,
      secure: false,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
      connectionTimeout: 60000,
      auth: {
        user: mailConfig.user,
        pass: mailConfig.pass,
      },
    };
    const transporter = createTransport(config);
    const mailOptions = {
      from: `${Branding_NotalX.name} <${mailConfig.user}>`,
      to: options.receiver,
      subject: options.subject,
      html: options.html,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(err);
  }
}

interface IUserSession {
  expiry: string;
  ip_address: string;
  user_agent: string;
  alias_id: string;
}

export async function PopulateCollaboratorForNotes(notes: INote[]) {
  return await Promise.all(
    notes.map(async (i) => ({
      note: i,
      collaborators: await PopulateNoteCollaborators(i.id!),
    }))
  );
}

export async function PopulateParticipantForTasks(tasks: ITask[]) {
  return await Promise.all(
    tasks.map(async (i) => ({
      task: i,
      participants: await PopulateTaskParticipants(i.id!, i.alias_id),
    }))
  );
}

export async function PopulateTaskParticipants(
  task_id: string,
  task_owner_id?: string
) {
  const find = await TaskParticipant.findAll({
    where: { task_id },
  });

  const rows = await Promise.all(
    find.map(async (i) => await Alias.findByPkWithCache(i.dataValues.alias_id))
  );

  // Add the owner to the collaborator if task_owner_id exists
  if (task_owner_id) {
    const findOwner = await Alias.findByPkWithCache(task_owner_id);
    rows.unshift(findOwner);
  }

  return rows;
}
export async function PopulateNoteCollaborators(note_id: string) {
  const note = await Note.findByPkWithCache(note_id);

  const findAll: INoteCollaborator[] = (await NoteCollaborator.findAll({
    where: { note_id },
    raw: true,
  })) as any;

  const rows = await Promise.all(
    findAll.map(async (i) => await Alias.findByPkWithCache(i.alias_id))
  );

  // Add the owner to the collaborator if note_owner_id exists
  const findOwner = await Alias.findByPkWithCache(note!.alias_id);
  rows.unshift(findOwner);

  return rows;
}
export function isExpired(expiry: string): boolean {
  const nowUTC = new Date();
  const expiryDate = new Date(expiry);
  return nowUTC > expiryDate;
}
export function setExpiryInUTC(hoursToAdd: number): string {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + hoursToAdd);
  return now.toISOString();
}

export async function getSessionFromReq(req: Request) {
  const sessionId = req.signedCookies[sessionCookieKey];
  const session: IUserSession | null = await memcachedService.get(
    CacheKeys.authSession(sessionId)
  );
  return session;
}

export async function Is_Alias_In_Session_Same_As_Alias(
  req: Request,
  alias_id: string
) {
  const session = await getSessionFromReq(req);
  if (!session) {
    return false;
  }
  if (session.alias_id !== alias_id) {
    return false;
  }
  if (isExpired(session.expiry)) {
    return false;
  }

  return true;
}

export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  const minLength = 3;
  const maxLength = 20;

  // Check length
  if (username.length < minLength || username.length > maxLength) {
    return {
      isValid: false,
      error: `Username must be between ${minLength} and ${maxLength} characters.`,
    };
  }

  // Check for invalid characters
  const validPattern = /^[a-zA-Z0-9_.\s]+$/;
  if (!validPattern.test(username)) {
    return {
      isValid: false,
      error:
        "Alias can only contain letters, numbers, underscores, periods, and spaces.",
    };
  }

  // Check for special characters at the start or end
  const startsOrEndsWithSpecialChar = /^[_.]|[_.]$/;
  if (startsOrEndsWithSpecialChar.test(username)) {
    return {
      isValid: false,
      error: "Alias cannot start or end with an underscore or period.",
    };
  }

  // Check for consecutive special characters
  const consecutiveSpecialChars = /[_.]{2,}/;
  if (consecutiveSpecialChars.test(username)) {
    return {
      isValid: false,
      error: "Alias cannot contain consecutive underscores or periods.",
    };
  }

  // Optional: Check for restricted words (e.g., profanity)

  if (!username || typeof username !== "string") {
    return {
      isValid: false,
      error: "Username must be a non-empty string.",
    };
  }
  if (
    RESTRICTED_WORDS.some((word) => username.toLowerCase().includes(word)) ||
    isProfane(username)
  ) {
    return {
      isValid: false,
      error: "Alias contains restricted words.",
    };
  }

  return { isValid: true };
}

export async function deleteExpiredNotes() {
  const now = new Date();
  try {
    // Find and delete all notes marked for self-destruction

    Note.destroy({
      where: {
        will_self_destroy: true,
        self_destroy_time: {
          [Op.lte]: now, // Notes where autoDeleteAt <= current time
        },
      },
    });
  } catch (error) {
    console.error("Error deleting expired notes:", error);
  }
}

export function validateIncomingNote(
  note: IncomingNote,
  validatationType: "update" | "create"
) {
  if (!note) {
    return { isValid: false, error: "Invalid note data provided" };
  }
  const { content, title, self_destroy_time, will_self_destroy } = note;

  const data: any = {};

  if (validatationType === "create") {
    if (!title || !content || title.trim() === "" || content.trim() === "") {
      return { isValid: false, error: "Note must have a title and content" };
    }
  }

  if (title) {
    if (
      RESTRICTED_WORDS.some((word) => title.toLowerCase().includes(word)) ||
      isProfane(title)
    ) {
      return {
        isValid: false,
        error: "The title contains words that are not allowed.",
      };
    }
    data.title = title;
  }

  if (content) {
    data.content = content;
  }

  if (will_self_destroy && !self_destroy_time) {
    return { isValid: false, error: "Enter a time for note deletion" };
  }

  if (self_destroy_time) {
    const validTime = parseLiteralTime(self_destroy_time);
    if (!validTime) {
      return {
        isValid: false,
        error: "Invalid timer. Please follow the format: <number> <unit>.",
      };
    }
    data.will_self_destroy = true;
    data.self_destroy_time = validTime;
  }

  return { isValid: true, data };
}

const determine_status_code = (errorCode: ErrorCodes) => {
  switch (errorCode) {
    case ErrorCodes.CONFLICT:
      return 409;
    case ErrorCodes.FORBIDDEN:
      return 403;
    case ErrorCodes.INTERNAL_SERVER_ERROR:
      return 500;
    case ErrorCodes.RESOURCE_NOT_FOUND:
      return 404;
    case ErrorCodes.UNAUTHORIZED:
      return 401;
    case ErrorCodes.VALIDATION_ERROR:
      return 400;
    default:
      return 500;
  }
};
export class ApiError extends Error {
  error_code: ErrorCodes;
  status_code: number;

  constructor(error_code: ErrorCodes, message?: string, status_code?: number) {
    super(message || "An error occurred");
    this.name = "ApiError";
    this.error_code = error_code;
    this.status_code = status_code ?? 500;

    // Capture stack trace if in development environment
    if (process.env.NODE_ENV === "development") {
      console.error(message, this);
      Error.captureStackTrace(this, ApiError);
    }
  }

  static error(error_code: ErrorCodes, message?: string) {
    return new ApiError(error_code, message, determine_status_code(error_code));
  }
}
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  // Regular Expression for robust email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email.trim());
}

export async function QueryLLM1(
  text: string,
  prompt: string
): Promise<
  ICloudflareResponse<{
    response: string;
  }>
> {
  try {
    const f = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: "post",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        body: JSON.stringify({
          prompt: {
            stream: false,
            raw: true,
            max_tokens: 512,
            temperature: 0.3,
            top_p: 0.5,
            top_k: 10,
            repetition_penalty: 1.2,
          },

          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: text,
            },
          ],
        }),
      }
    );

    const res: ICloudflareResponse<{
      response: string;
    }> = await f.json();
    return res;
  } catch (err) {
    console.error(err);
    return {
      success: false,
      errors: [],
      messages: [],
      result: { response: null as any },
    };
  }
}

export async function fanOutNotification(
  type: NotificationType,
  content: { title: string; message: string; metadata: any },
  receiver_ids: string[]
) {
  receiver_ids.forEach(async (id) => {
    await Notification.create({
      alias_id: id,
      is_read: false,
      message: content.message,
      title: content.title,
      metadata: content.metadata,
      type,
    });
  });
}
