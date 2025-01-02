import baseX from "base-x";

import {
  _IAlias,
  IAnyJob,
  ApiFetchNote,
  IApiResponse,
  INote,
  IPaginatedResponse,
  ISummaryResponse,
  IScheduleTaskPayload,
} from "../type";

export function isSessionExpired(expiry: string): boolean {
  const nowUTC = new Date();
  const expiryDate = new Date(expiry);
  return nowUTC > expiryDate;
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
  const f = await fetch(`/api/note/${note_id}/job/summerise`, {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(highlightedText),
    method: "POST",
  });
  return (await f.json()) as Promise<IApiResponse<ISummaryResponse>>;
}

type ab12 = Promise<IApiResponse<IAnyJob<IScheduleTaskPayload>[]>>;
export async function createScheduleTask(
  note_id: string,
  highlightedText: {
    text: string;
    start_index: number;
    end_index: number;
  }
): ab12 {
  const f = await fetch(`/api/note/${note_id}/job/schedule`, {
    headers: {
      "content-type": "application/json",
    },
    body: highlightedText ? JSON.stringify(highlightedText) : "",
    method: "POST",
  });
  return (await f.json()) as ab12;
}

export const fetchAllJobsForAlias = async () => {
  const f = await fetch(`/api/job`, {
    headers: {
      "content-type": "application/json",
    },
  });
  return (await f.json()) as Promise<IApiResponse<IAnyJob<unknown>>>;
};

export function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const timeUnits: { unit: string; seconds: number }[] = [
    { unit: "year", seconds: 365 * 24 * 60 * 60 },
    { unit: "month", seconds: 30 * 24 * 60 * 60 },
    { unit: "day", seconds: 24 * 60 * 60 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "min", seconds: 60 },
    { unit: "sec", seconds: 1 },
  ];

  for (const { unit, seconds } of timeUnits) {
    const value = Math.floor(diffInSeconds / seconds);
    if (value > 0) {
      return value === 1 ? `A ${unit} ago` : `${value} ${unit}s ago`;
    }
  }

  return "just now";
}
export const formatDate = (date: any) => {
  console.log(date);
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
