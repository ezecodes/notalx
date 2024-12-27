import { Op } from "sequelize";
import Note from "./models/Note";
import { ErrorCodes, IncomingNote, INote } from "./type";
import { randomBytes } from "crypto";
import {
  Branding_NotalX,
  CacheKeys,
  mailConfig,
  sessionCookieKey,
} from "./constants";
import { createTransport } from "nodemailer";
import { NextFunction, Request, Response } from "express";
import memcachedService from "./memcached";

export const getRandomInt = (min = 100_000, max = 900_000) => {
  return Math.floor(Math.random() * (max - min) + min);
};

export function generateSlug(
  title: string,
  maxWords: number = 3,
  is_hidden: boolean
): string {
  if (is_hidden) {
    return randomBytes(9).toString("base64url");
  }

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
  /^\d+\s*(second|seconds|minute|minutes|day|days|year|years)$/i;

export function validateSelfDestroyTime(input: string): boolean {
  if (input.split(" ").length !== 2) return false;
  return validTimeRegex.test(input);
}
export function parseSelfDestroyTimeToDate(input: string): Date | boolean {
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

export async function getSession(req: Request) {
  const sessionId = req.signedCookies[sessionCookieKey];
  const session: IUserSession | null = await memcachedService.get(
    CacheKeys.authSession(sessionId)
  );

  return session;
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
export async function isAuthorizedAlias(req: Request, aliasId: string) {
  const session = await getSession(req);
  if (!session) {
    return false;
  }
  if (session.alias_id !== aliasId) {
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
  const validPattern = /^[a-zA-Z0-9_.]+$/;
  if (!validPattern.test(username)) {
    return {
      isValid: false,
      error:
        "Alias can only contain letters, numbers, underscores, and periods.",
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

  // Check for spaces
  if (/\s/.test(username)) {
    return {
      isValid: false,
      error: "Alias cannot contain spaces.",
    };
  }

  // Optional: Check for restricted words (e.g., profanity)
  const restrictedWords = ["admin", "root", "moderator", "notal"];
  if (restrictedWords.some((word) => username.toLowerCase().includes(word))) {
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

export function validateIncomingNote(note: IncomingNote) {
  const {
    content,
    title,
    is_hidden,
    secret,
    self_destroy_time,
    will_self_destroy,
  } = note;

  if (!title || !content) {
    return { isValid: false, error: "Note must have a title and content" };
  }

  if (is_hidden && !secret) {
    return { isValid: false, error: "Enter a secret for hidden note" };
  }
  if (will_self_destroy && !self_destroy_time) {
    return { isValid: false, error: "Enter a time for note deletion" };
  }

  if (self_destroy_time) {
    const valid = parseSelfDestroyTimeToDate(self_destroy_time);
    if (!valid) {
      return {
        isValid: false,
        error: "Invalid timer. Please follow the format: <number> <unit>.",
      };
    }
  }

  return { isValid: true };
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
      Error.captureStackTrace(this, ApiError);
    }
  }

  static error(error_code: ErrorCodes, message?: string) {
    return new ApiError(error_code, message, determine_status_code(error_code));
  }
}
