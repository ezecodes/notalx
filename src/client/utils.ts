import {
  _Alias,
  IAlias,
  IApiResponse,
  INote,
  IPaginatedResponse,
} from "../type";

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
  return (await f.json()) as IPaginatedResponse<Omit<IAlias, "secret">>;
};

export const fetchAliasNotes = async (id: string) => {
  const f = await fetch("/api/note/alias/" + id);
  return (await f.json()) as IPaginatedResponse<INote>;
};
export const searchAliasByName = async (name: string) => {
  const f = await fetch("/api/alias/search?name=" + name);
  return (await f.json()) as IPaginatedResponse<_Alias>;
};
export const fetchNote = async (slug: string) => {
  const f = await fetch("/api/note/" + slug);
  return (await f.json()) as IApiResponse<INote>;
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
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];

  for (const { unit, seconds } of timeUnits) {
    const value = Math.floor(diffInSeconds / seconds);
    if (value > 0) {
      return value === 1 ? `A ${unit} ago` : `${value} ${unit}s ago`;
    }
  }

  return "just now";
}
