import dotenv from "dotenv";
dotenv.config();

export const sessionCookieKey = "s-tkn";
export const otpSessionCookieKey = "pp-ses";
export const Branding_NotalX = {
  name: "Notal X",
  tagline: "Your Ideas, Redefined.",
  description:
    "NotalX is a platform where your creativity takes center stage. Capture, refine, and share your most meaningful insights with the world—or keep them private, secure, and accessible only to you. With NotalX, your ideas are more than just thoughts—they're the foundation of something extraordinary.",
};

export const mailConfig = {
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASSWORD,
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
};

export const CacheKeys = {
  otp: (session_slug: string) => `otp:${session_slug}`,
  authSession: (sessionId: string) => `authSession:${sessionId}`,
};

export const NoteAttributes = [
  "is_hidden",
  "title",
  "content",
  "createdAt",
  "slug",
  "id",
  "alias_id",
  "will_self_destroy",
  "self_destroy_time",
];
