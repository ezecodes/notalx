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
  "title",
  "content",
  "createdAt",
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

export const CLOUDFLARE_ID = process.env.CLOUDFLARE_ID;
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

export const SUMMARY_PROMPT_VARIATIONS = [
  {
    description: "Concise and Focused",
    prompt:
      "Summarize the following text, retaining **only the essential details** and **logical relationships**. Ensure that no assumptions or external context are added. Present the summary in **clear, simple terms**. Do not start with 'Here is a summary of the text'.",
  },
  {
    description: "Precision with Structured Output",
    prompt: `
    Provide a summary of the following text, highlighting:
    - **Key Distinctions**: Major differences or conditions mentioned.  
    - **Logical Connections**: Relationships between concepts.
    - **Nuances**: Subtle details that are crucial for understanding.  
    Ensure the summary is **context-agnostic**, and avoid external assumptions. Do not start with 'Here is a summary of the text'.`,
  },
  {
    description: "Instructional with Focus on Clarity",
    prompt: `Summarize the text below while ensuring that:
    - The summary is **self-contained** and does not rely on any inferred or external context.
    - **Critical points** and **relationships** are retained without adding unnecessary details.
    - The summary is **succinct** and **to the point**. Do not start with 'Here is a summary of the text'.`,
  },
  {
    description: "Detailed, with Emphasis on Logical Flow",
    prompt: `Summarize the following text, emphasizing:
    - The **logical structure** of the content, including key distinctions.
    - **Key elements** and their relationships, such as cause/effect or conditions.
    - **Important nuances** that should not be overlooked.

    Ensure the summary is **direct** and **free of assumptions** about external context. Do not start with 'Here is a summary of the text'.`,
  },
  {
    description: "High-Level Focus on Key Ideas",
    prompt: `Summarize the following text by focusing on the **main ideas** and **critical distinctions**. Do not introduce any context beyond what is provided. The summary should be **focused** and **straightforward** without unnecessary elaboration. Do not start with 'Here is a summary of the text'.`,
  },
  {
    description: "Analytical Breakdown",
    prompt: `Provide a **detailed summary** of the following text:
    1. **Primary concepts**: What are the key messages or ideas?
    2. **Relationships**: How do the concepts or ideas relate to each other?
    3. **Important distinctions**: What differences or conditions must be noted?

    Ensure the summary is **context-agnostic** and does not involve assumptions. Do not start with 'Here is a summary of the text'.`,
  },
  {
    description: "Logical & Nuanced Focus",
    prompt: `Summarize the text, focusing on the following:
    - The **core ideas** and their **logical connections**.
    - **Conditions** and **distinctions** that are critical to understanding.
    - Avoid introducing any **external context** or assumptions.

    Provide a summary that is **comprehensive** yet **concise**. Do not start with 'Here is a summary of the text'.`,
  },
  {
    description: "Emphasizing Clarity and Completeness",
    prompt: `Summarize the provided text with **attention to detail**, ensuring:
    - All **logical relationships** and **key distinctions** are captured.
    - The summary is **complete** but **concise**, highlighting the most important elements.
    - The text is summarized **independently**, without any additional context. Do not start with 'Here is a summary of the text'.`,
  },
  {
    description: "Focus on Distinctions and Logical Flow",
    prompt: `Summarize the following content by highlighting:
    - The **primary distinctions** or differences within the text.
    - The **logical flow** or structure of ideas.
    - Any **implications** that are important for understanding.

    Ensure the summary is **self-contained**, avoiding assumptions about external context. Do not start with 'Here is a summary of the text'.`,
  },
  {
    description: "Action-Oriented Summary",
    prompt: `Summarize the provided text by focusing on:
    - **Actionable points** and **key distinctions** that drive the main ideas.
    - **Key relationships** between concepts or conditions.
    - A **concise** and **clear** summary that doesn't assume any external context. Do not start with 'Here is a summary of the text'.`,
  },
];
export const TASK_SCHEDULING_PROMPT_VARIATIONS = [
  {
    description: "Task Extraction with Time & Date Inference",
    prompt: `
      You are an advanced assistant designed to extract and organize multiple tasks from a note. Your response must be in strict JSON format without any additional text, explanations, or formatting (e.g., no markdown or plain text).

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

      ### Example Input:
      "Meeting with Sarah at 2 PM tomorrow. Call with client on Monday at 10 AM in the conference room. Lunch with team at noon next week."

      ### Expected Output (Strict JSON Only):
      {
        "success": true,
        "message": "Tasks successfully extracted.",
        "tasks": [
          {
            "task_title": "Meeting with Sarah",
            "date": "2025-01-03",
            "time": "2:00 PM",
            "participants": ["Sarah"],
            "location": ""
          },
          {
            "task_title": "Call with client",
            "date": "2025-01-06",
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
      }

      ### Example Input:
      "Hello world, this has nothing useful"

      ### Expected Output (Strict JSON Only):
      {
        "success": false,
        "message": "No valid tasks could be extracted from the input."
      }

      - **IMPORTANT**: Ensure the response begins and ends with JSON and contains no other text, explanation, or additional formatting.
      - **Invalid Output Examples**: Responses with text like "Here is your JSON" or markdown fences (\`\`\`) will be rejected.
    `,
  },
];

export const EAMIL_DRAFTING_PROMPT_VARIATIONS = [
  {
    description: "",
    prompt: `You are an advanced language model tasked with generating professional and effective emails from unstructured notes. Based on the provided note, your objective is to create a clear, concise, and well-structured email suitable for its context and audience.

    Instructions:
    Understand the Note: Extract the purpose, key details, tone, and audience of the email from the note.
    Email Components: Ensure the email includes:
    Subject Line: A concise and relevant subject summarizing the email\'s purpose.
    Greeting: Address the recipient appropriately based on the note.
    Opening: Provide a brief introduction or context for the email.
    Body: Organize the main points logically, addressing any actions, requests, or information clearly and professionally.
    Closing: Include a polite conclusion and, if necessary, specify next steps or actions.
    Signature: Use a professional closing line and generic placeholder for the sender\'s name, title, and contact information.
    Adhere to Tone and Style:
    If the note specifies a tone (e.g., formal, casual, persuasive), follow it.
    If no tone is mentioned, default to a professional yet approachable tone.
    Address Ambiguities: Where the note lacks specific details (e.g., recipient name, exact dates), use placeholders (e.g., “[Recipient\'s Name]”, “[Date]”).
    ### Expected Output (JSON):
      {
        "success": true,
        "email": {
          "subject": "[Generated subject line]",
          "body": "[Generated email body including greeting, opening, body content, closing, and signature]"
        }
      }
      If you cannot draft an email due to insufficient details in the note, respond with:
      
      {
        "success": false,
        "message": "[Reason why an email could not be generated]"
      }

      Example Input: 
      Note: "Reminder to the team about the project deadline on Friday. Make sure they submit reports by Thursday evening. Thank them for their hard work so far."

      Example Output:
      {
        "success": true,
        "email": {
          "subject": "Reminder: Project Deadline and Report Submission",
          "body": "Dear Team,\n\nI hope this message finds you well. This is a friendly reminder about our project deadline scheduled for this Friday. Please ensure that all reports are submitted by Thursday evening.\n\nThank you for your hard work and dedication so far—I truly appreciate your efforts.\n\nBest regards,\n[Your Name]\n[Your Title]\n[Your Contact Information]"
        }
      }

      Guidelines:
      Maintain accuracy and professionalism.
      Generate content that is actionable, concise, and polished.
      Use placeholders for missing information to ensure clarity for the user.

    `,
  },
];

export const RESTRICTED_WORDS = [
  "ass",
  "bitch",
  "crap",
  "damn",
  "fuck",
  "shit",
  "slut",
  "whore",
  "bastard",
  "dick",
  "pussy",
  "cock",
  "cunt",
  "nigger",
  "fag",
  "faggot",
  "retard",
  "spaz",
  "twat",
  "wank",
  "jerkoff",
  "phuck",
  "arse",
  "bollocks",
  "bugger",
  "shag",
  "slag",
  "tosser",
  "wanker",
  "motherfucker",
  "douche",
  "douchebag",
  "turd",
  "cum",
  "sex",
  "s3x",
  "69",
  "porn",
  "pornhub",
  "xnxx",
  "xxx",
  "boob",
  "boobs",
  "tit",
  "tits",
  "vagina",
  "penis",
  "testicle",
  "scrotum",
  "clit",
  "clitoris",
  "orgasm",
  "ejaculation",
  "masturbate",
  "masturbation",
  "anal",
  "rectum",
  "hentai",
  "kinky",
  "suck",
  "blowjob",
  "b00b",
  "a55",
  "s3x",
  "d1ck",
  "sh1t",
  "phag",
  "f*ck",
  "f@ck",
  "fu*k",
  "f#ck",
  "b!tch",
  "b@stard",
  "b!tch",
  "sh!t",
  "c*ck",
  "c@nt",
  "cu*t",
  "p*ssy",
  "n*gger",
  "f*ggot",
];
