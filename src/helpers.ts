import { Op, Sequelize } from "sequelize";
import {
  _IAlias,
  ErrorCodes,
  IAlias,
  ICloudflareResponse,
  ICreateIndex,
  IncomingNote,
  INote,
  INoteCollaborator,
  INoteHistory,
  IPagination,
  ITask,
  IVectorEmbedding,
  NotificationType,
} from "./type";
import {
  Branding_NotalX,
  CacheKeys,
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_AUTH_EMAIL,
  CLOUDFLARE_ID,
  mailConfig,
  ORGANISE_NOTE_PROMPT,
  RESTRICTED_WORDS,
  sessionCookieKey,
  VectorIndexName,
} from "./constants";
import { createTransport } from "nodemailer";
import { Request } from "express";
import memcachedService from "./memcached";
import { isProfane } from "no-profanity";
import { z } from "zod";
import {
  Alias,
  Note,
  NoteCollaborator,
  NoteHistory,
  Notification,
  TaskParticipant,
} from "./models";
import pinecone, { PINECONE_INDEX } from "./pinecone";
import fs from "fs";
import path from "path";
import { encodeToBase62 } from "./client/utils";

export const getRandomInt = (min = 100_000, max = 900_000) => {
  return Math.floor(Math.random() * (max - min) + min);
};
function stripHtmlTags(input: string): string {
  // Replace HTML tags using a regular expression
  return input.replace(/<[^>]*>/g, "").trim();
}
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

export const create_category_validator = z
  .object({
    category: z.string().min(5, { message: "Enter category name" }).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Request body cannot be empty",
  });

export const notes_categorization_cron_job = async () => {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const lastPagination: IPagination = (await memcachedService.get(
    `last_pagination`
  )) as any;

  let page, page_size;

  if (!lastPagination) {
    page = 1;
    page_size = 15;
  } else {
    page = lastPagination.page;
    page_size = lastPagination.page_size;
  }

  const offset = (page - 1) * page_size;

  const notes: INote[] = (await Note.findAll({
    limit: page_size,
    offset,
    raw: true,
    where: { category_name: null as any },
  })) as any;

  if (notes.length === 0) {
    console.log("--1--No new note found--");
    return;
  }
  const aiResponse = await QueryLLM1(
    JSON.stringify(notes),
    ORGANISE_NOTE_PROMPT
  );
  console.log(aiResponse);

  if (!aiResponse.success) {
    console.error(aiResponse);
    return;
  }

  try {
    const parseJson: {
      success: boolean;
      message: string;
      data: {
        note_id: string;
        name: string;
        category: string;
        tags: string[];
      }[];
    } = JSON.parse(aiResponse.result.response);

    parseJson.data.forEach(async (item) => {
      Note.updateByIdWithCache(item.note_id, {
        category_name: item.category,
        tags: item.tags,
      });
    });
  } catch (err) {
    console.error("Could not parse response JSON", err);
  }

  memcachedService.set(
    "last_pagination",
    { page: page + 1, page_size: page_size + 15 },
    3600
  );
};

export function prepare_note_for_embedding(note: INote): string {
  let { title, content, tags, category_name } = note;
  content = stripHtmlTags(content);
  const tagString = tags ? tags.join(", ") : "";
  return `${title}\n${content}\nTags: ${tagString}\nCategory: ${
    category_name || "None"
  }`;
}
export async function generate_embedding(input: string): Promise<number[]> {
  const f = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ID}/ai/run/@cf/baai/bge-large-en-v1.5`,

    {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      method: "post",
      body: JSON.stringify({ text: input }),
    }
  );
  const response: ICloudflareResponse<IVectorEmbedding> = await f.json();

  return response.result.data;
}

const create_vector_index = async (alias_id: string) => {
  try {
    const f = await fetch(
      ` https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ID}/vectorize/v2/indexes`,

      {
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        method: "post",
        body: JSON.stringify({
          config: {
            dimensions: 768,
            metric: "cosine",
          },
          name: `alias-notes:${alias_id}`,
        }),
      }
    );
    const response: ICloudflareResponse<ICreateIndex> = await f.json();
    return response;
  } catch (err) {
    console.error("Error creating vctor index", err);
  }
};

const upsertVectors = async (
  alias_id: string,
  notes: { id: string; values: number[]; metadata: any }[]
) => {
  try {
    await PINECONE_INDEX.namespace(`alias_${alias_id}`).upsert(notes);
  } catch (error) {
    console.error("Error upserting vectors:", error);
  }
};

export const notes_indexing_cron_job = async () => {
  try {
    let notes: INote[] = (await Note.findAll({
      where: {
        updatedAt: {
          [Op.gte]: new Date(Date.now() - 360 * 1000),
        },
      },
      raw: true,
    })) as any;

    if (notes.length === 0) return;

    let processNotes = await Promise.all(
      notes.map(async (note) => {
        const vectorizedValues = await generate_embedding(
          prepare_note_for_embedding(note)
        );

        let _note = {
          id: note.id,
          values: vectorizedValues,
          metadata: {
            title: note.title,
            alias_id: note.alias_id,
            self_destroy_time: note.self_destroy_time?.toISOString() ?? "none",
            category_name: note.category_name ?? "none",
            tags: note.tags ?? "",
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
          },
        };
        return _note;
      })
    );

    const categorizedNotes = processNotes.reduce((acc, note) => {
      let category = acc.find(
        (item) => item.alias_id === note.metadata.alias_id
      );

      if (!category) {
        category = { alias_id: note.metadata.alias_id, notes: [] };
        acc.push(category);
      }

      category.notes.push(note);

      return acc;
    }, [] as { alias_id: string; notes: typeof processNotes }[]);

    categorizedNotes.forEach(async (alias_notes) => {
      upsertVectors(alias_notes.alias_id, alias_notes.notes);
    });
  } catch (err) {
    console.error(err);
  }
};
notes_indexing_cron_job();

export async function queryVectors(value: string, alias_id: string) {
  const vector = await generate_embedding(value);
  try {
    const queryResponse = await PINECONE_INDEX.namespace(
      `alias_${alias_id}`
    ).query({
      vector,
      topK: 1,
      includeMetadata: true,
      filter: {
        alias_id: { $eq: alias_id },
      },
    });
    console.log(queryResponse);
  } catch (err) {
    console.error("Error getting query vector", err);
  }
}
