import baseX from "base-x";

import {
  _IAlias,
  ApiFetchNote,
  IApiResponse,
  INote,
  IPaginatedResponse,
  ISummaryResponse,
  ITask,
} from "../type";
export const DEFAULT_SCHEDULE_REMINDERS = [
  "5 mins before",
  "10 mins before",
  "15 mins before",
  "30 mins before",
  "60 mins before",
];
export function isSessionExpired(expiry: string): boolean {
  const nowUTC = new Date();
  const expiryDate = new Date(expiry);
  return nowUTC > expiryDate;
}

export function navigateBackOrHome(homePath: string = "/") {
  const referrer = document.referrer;
  const currentDomain = window.location.origin;

  if (referrer.startsWith(currentDomain)) {
    // Referrer is part of the same domain
    window.history.back();
  } else {
    // Referrer is not part of the same domain, or no referrer
    window.location.href = homePath;
  }
}
export const parseUrl = (url: any) => {
  // Create a URL object
  const parsedUrl = new URL(url);

  // Extract query parameters using URLSearchParams
  const queryParams = new URLSearchParams(parsedUrl.search);

  const requestQuery: Record<string, string> = {};
  queryParams.forEach((value, key) => {
    requestQuery[key] = value;
  });

  return { parsedUrl, requestQuery };
};
export const fetchAllAlias = async () => {
  const f = await fetch("/api/alias");
  return (await f.json()) as IPaginatedResponse<_IAlias>;
};

export const fetchAliasPublicAndPrivateNotes = async () => {
  const f = await fetch(`/api/alias/note`);
  return (await f.json()) as IApiResponse<{ rows: ApiFetchNote[] }>;
};

export const fetchAliasPublicNotes = async (id: string) => {
  const f = await fetch(`/api/alias/${id}/note`);
  return (await f.json()) as IApiResponse<{ alias: _IAlias; notes: INote[] }>;
};
export const searchAliasByName = async (name: string) => {
  const f = await fetch("/api/alias/search?name=" + name);
  return (await f.json()) as IPaginatedResponse<_IAlias>;
};
export const fetchAllPublicNotes = async () => {
  const f = await fetch("/api/note/");
  return (await f.json()) as IApiResponse<{
    rows: ApiFetchNote[];
  }>;
};

export const fetchNote = async (slug: string, secret: string) => {
  const f = await fetch("/api/note/" + slug, {
    headers: {
      "content-type": "application/json",
      Authorization: secret,
      Accept: "application/json",
    },
  });
  return (await f.json()) as IApiResponse<{
    note: INote;
    collaborators: _IAlias[];
  }>;
};
export const fetchAlias = async (id: string) => {
  const f = await fetch("/api/alias/" + id);
  return (await f.json()) as IApiResponse<_IAlias>;
};

export async function summeriseSelectedText(
  note_id: string,
  highlightedText: {
    text: string;
    start_index: number;
    end_index: number;
  }
): Promise<IApiResponse<ISummaryResponse>> {
  const f = await fetch(`/api/note/${note_id}/summerise`, {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(highlightedText),
    method: "POST",
  });
  return (await f.json()) as Promise<IApiResponse<ISummaryResponse>>;
}

type ITaskList = Promise<
  IPaginatedResponse<{ task: ITask; participants: _IAlias[] }>
>;
export async function createScheduleTask(
  note_id: string,
  highlightedText: {
    text: string;
    start_index: number;
    end_index: number;
  }
): ITaskList {
  const f = await fetch(`/api/note/${note_id}/task`, {
    headers: {
      "content-type": "application/json",
    },
    body: highlightedText ? JSON.stringify(highlightedText) : "",
    method: "POST",
  });
  return (await f.json()) as ITaskList;
}
export const fetchAllScheduledTasksForAlias = async (): ITaskList => {
  const f = await fetch(`/api/task`, {
    headers: {
      "content-type": "application/json",
    },
  });
  return (await f.json()) as ITaskList;
};

export function calculateReminderLiteral(
  fixedDate: Date | string,
  reminderDate: Date | string
): string | null {
  const fixed = new Date(fixedDate);
  const reminder = new Date(reminderDate);

  // Calculate the difference in minutes
  const diffInMinutes = Math.round(
    (fixed.getTime() - reminder.getTime()) / (60 * 1000)
  );

  // Match the difference with the predefined literals
  const matchedReminder = DEFAULT_SCHEDULE_REMINDERS.find((reminder) => {
    const minutes = parseInt(reminder.split(" ")[0], 10);
    return minutes === diffInMinutes;
  });

  return matchedReminder || null; // Return the matched literal or null if not found
}

export function calculateReminderDate(
  fixedDate: Date | string,
  selectedReminder: string
): Date | null {
  const reminderMinutes = parseInt(selectedReminder.split(" ")[0], 10);

  if (isNaN(reminderMinutes)) {
    console.error("Invalid reminder format:", selectedReminder);
    return null; // Return null if the format is invalid
  }

  const date = new Date(fixedDate);

  // Subtract the reminder minutes from the fixed date
  date.setMinutes(date.getMinutes() - reminderMinutes);

  return date;
}
export function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000); // Notice the change here for future dates

  const timeUnits: { unit: string; seconds: number }[] = [
    { unit: "year", seconds: 365 * 24 * 60 * 60 },
    { unit: "month", seconds: 30 * 24 * 60 * 60 },
    { unit: "day", seconds: 24 * 60 * 60 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "min", seconds: 60 },
    { unit: "sec", seconds: 1 },
  ];

  if (diffInSeconds < 0) {
    // Past timestamps
    for (const { unit, seconds } of timeUnits) {
      const value = Math.floor(Math.abs(diffInSeconds) / seconds);
      if (value > 0) {
        return value === 1 ? `A ${unit} ago` : `${value} ${unit}s ago`;
      }
    }
    return "just now";
  } else {
    // Future timestamps
    for (const { unit, seconds } of timeUnits) {
      const value = Math.floor(diffInSeconds / seconds);
      if (value > 0) {
        return value === 1 ? `In a ${unit}` : `In ${value} ${unit}s`;
      }
    }
    return "just now";
  }
}

export const formatDate = (date: any) => {
  date = new Date(date);
  const hours = date.getHours() % 12 || 12; // Convert to 12-hour format
  const ampm = date.getHours() >= 12 ? "pm" : "am";
  const minutes = date.getMinutes().toString().padStart(2, "0"); // Pad minutes if needed
  const day = date.toLocaleString("en-US", { weekday: "short" }); // Abbreviated weekday
  const dateNum = date.getDate(); // Day of the month
  const month = date.toLocaleString("en-US", { month: "short" }); // Abbreviated month

  return `${hours}:${ampm} ${day} ${dateNum} ${month}`;
};
const BASE62 = baseX(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
);

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Helper function to convert Uint8Array back to hex
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Encode UUID to Base62
export function encodeToBase62(uuid: string): string {
  const hex = uuid.replace(/-/g, ""); // Remove hyphens
  const bytes = hexToUint8Array(hex);
  return BASE62.encode(bytes);
}

// Decode Base62 back to UUID
export function decodeFromBase62(base62: string): string {
  const bytes = BASE62.decode(base62);
  const hex = uint8ArrayToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
