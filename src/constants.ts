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

export const DEFAULT_SCHEDULE_REMINDERS = [
  "5 mins before",
  "10 mins before",
  "15 mins before",
  "30 mins before",
  "60 mins before",
];

export const AliasAttributes = ["id", "name"];

export const X_API_KEY = process.env.X_API_KEY;

export const SUMMARY_PROMPT_VARIATIONS = [
  {
    decription: "Concise and Focused",
    prompt:
      "Summarize the following text, retaining **only the essential details** and **logical relationships**. Ensure that no assumptions or external context are added. Present the summary in **clear, simple terms**.",
  },
  {
    description: "Precision with Structured Output",
    prompt: `
    Provide a summary of the following text, highlighting:
    - **Key Distinctions**: Major differences or conditions mentioned.  
    - **Logical Connections**: Relationships between concepts.
    - **Nuances**: Subtle details that are crucial for understanding.  
    Ensure the summary is **context-agnostic**, and avoid external assumptions.`,
  },
  {
    description: "Instructional with Focus on Clarity",
    prompt: `Summarize the text below while ensuring that:
    - The summary is **self-contained** and does not rely on any inferred or external context.
    - **Critical points** and **relationships** are retained without adding unnecessary details.
    - The summary is **succinct** and **to the point**.`,
  },
  {
    description: "Detailed, with Emphasis on Logical Flow",
    prompt: `Summarize the following text, emphasizing:
    - The **logical structure** of the content, including key distinctions.
    - **Key elements** and their relationships, such as cause/effect or conditions.
    - **Important nuances** that should not be overlooked.

    Ensure the summary is **direct** and **free of assumptions** about external context.`,
  },
  {
    description: "High-Level Focus on Key Ideas",
    prompt: `Summarize the following text by focusing on the **main ideas** and **critical distinctions**. Do not introduce any context beyond what is provided. The summary should be **focused** and **straightforward** without unnecessary elaboration.
`,
  },
  {
    description: "Analytical Breakdown",
    prompt: `Provide a **detailed summary** of the following text:
    1. **Primary concepts**: What are the key messages or ideas?
    2. **Relationships**: How do the concepts or ideas relate to each other?
    3. **Important distinctions**: What differences or conditions must be noted?

    Ensure the summary is **context-agnostic** and does not involve assumptions.`,
  },
  {
    description: "Logical & Nuanced Focus",
    prompt: `Summarize the text, focusing on the following:
    - The **core ideas** and their **logical connections**.
    - **Conditions** and **distinctions** that are critical to understanding.
    - Avoid introducing any **external context** or assumptions.

    Provide a summary that is **comprehensive** yet **concise**.`,
  },
  {
    description: "Emphasizing Clarity and Completeness",
    prompt: `Summarize the provided text with **attention to detail**, ensuring:
    - All **logical relationships** and **key distinctions** are captured.
    - The summary is **complete** but **concise**, highlighting the most important elements.
    - The text is summarized **independently**, without any additional context.`,
  },
  {
    description: "Focus on Distinctions and Logical Flow",
    prompt: `Summarize the following content by highlighting:
    - The **primary distinctions** or differences within the text.
    - The **logical flow** or structure of ideas.
    - Any **implications** that are important for understanding.

    Ensure the summary is **self-contained**, avoiding assumptions about external context.`,
  },
  {
    description: "Action-Oriented Summary",
    prompt: `Summarize the provided text by focusing on:
    - **Actionable points** and **key distinctions** that drive the main ideas.
    - **Key relationships** between concepts or conditions.
    - A **concise** and **clear** summary that doesn\'t assume any external context.`,
  },
];

export const TASK_SCHEDULING_PROMPT_VARIATIONS = [
  {
    description: "Task Extraction with Time & Date Inference",
    prompt: `
      You are an advanced assistant designed to extract and organize multiple tasks from a note. The tasks may vary in detail, and some information (such as date and time) may need to be inferred based on the current date (similar to how new Date() works in JavaScript).

    For each task, extract and format the following details:
    1. **Task Title/Description**: Identify the primary action or event (e.g., "Meeting with client", "Call with John").
    2. **Date**: 
        - If a **specific date** (e.g., "January 10") is mentioned, use that date directly.
        - If a **day of the week** is mentioned (e.g., "Monday", "Friday"), calculate the date based on the current date (e.g., if today is Thursday and "Monday" is mentioned, infer the **next Monday's date**).
        - If **relative terms** like "tomorrow", "next week", or "in 3 days" are used, calculate the date based on the current date, using today's date to infer the date.
    3. **Time**: 
        - If a **specific time** (e.g., "2 PM", "10:30 AM") is mentioned, extract the time directly.
        - If **relative time** (e.g., "in the morning", "late afternoon", "at noon") is used, infer the actual time based on standard time conventions.
    4. **Participants**: Identify people or roles mentioned (e.g., "John", "team", "client").
    5. **Location**: If a location is mentioned (e.g., "office", "Zoom"), include it.

    ### Inference Details:
    - Use **current date and time** (like new Date()) to calculate relative time (e.g., "tomorrow", "next Monday").
    - Consider **time ranges** like "in the morning", "late afternoon", or "noon" and convert them to **precise hours** (e.g., "in the morning" = 9 AM, "noon" = 12 PM).
    - If **no time** is provided but a **date** is given, assume a **standard workday** time (e.g., 9 AM to 5 PM) unless specified otherwise.

    ### Output Format:
    Return each task in **JSON format** with the following fields:
    - **task_title**: The description or action of the task.
    - **date**: The inferred date in YYYY-MM-DD format.
    - **time**: The inferred time in HH:MM AM/PM format (if applicable).
    - **participants**: An array of people involved in the task (can be empty if not mentioned).
    - **location**: The location of the task (can be empty if not mentioned).

    ### Example Input:
    "Meeting with Sarah at 2 PM tomorrow. Call with client on Monday at 10 AM in the conference room. Lunch with team at noon next week."

    ### Expected Output (JSON):
    Assuming today is **Thursday, January 2, 2025**:
    
    [
      {
        "task_title": "Meeting with Sarah",
        "date": "2025-01-03",
        "time": "2:00 PM",
        "participants": ["Sarah"],
        "location": ""
      },
      {
        "task_title": "Call with client",
        "date": "2025-01-05",
        "time": "10:00 AM",
        "participants": ["client"],
        "location": "conference room"
      },
      {
        "task_title": "Lunch with team",
        "date": "2025-01-09",
        "time": "12:00 PM",
        "participants": ["team"],
        "location": ""
      }
    ]


    `,
  },
];
