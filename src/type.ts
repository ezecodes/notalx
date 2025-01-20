export type IUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export enum NotificationType {
  AddedParticipant = "added_participant",
  AddedCollaborator = "added_collaborator",
  TaskReminder = "task_reminder",
  WelcomeMessage = "welcome_message",
  LoginAlert = "login_alert",
}

export type AddedParticipantMetadata = {
  task_link: string;
};

export type INotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  user_id: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
};

export type _IUser = {
  id: string;
  name: string;
  email?: string;
};
export type ITaskParticipant = {
  id: string;
  task_id: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
};
export type IOtp = {
  id: string;
  hash: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};
export type ISession = {
  id: string;
  ip_address: string;
  user_agent: string;
  user_id: string;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type ICategory = {
  id: string;
  name: string;
  reference_category_id?: string;
  createdAt: Date;
  updatedAt: Date;
};
export type INote = {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  self_destroy_time?: Date;
  category_name?: string;
  tags?: string[];
  last_indexed?: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type INoteHistory = {
  note_id: string;
  updated_by: string;
  reason?: string;
  changes: {
    title?: { oldValue: string; newValue: string };
    content?: { oldValue: string; newValue: string };
  };
  createdAt: Date;
  updatedAt: Date;
};
export type ApiFetchNote = {
  collaborators: _IUser[];
  note: INote;
};
/**
 * Represents the structure of the schema.
 */
export type IVectorEmbedding = {
  /** An array of numbers representing the shape of the embedding. */
  shape: number[];

  /**
   * A 2D array of numbers representing embeddings of the requested text values.
   * Each embedding is a floating point array shaped by the embedding model.
   */
  data: number[];
};

export type IMetric = "cosine" | "euclidean" | "dot-product";

export type ICreateIndex = {
  config: {
    dimensions: number;
    metric: IMetric;
  };
  created_on: Date;
  description: string;
  modified_on: Date;
  name: string;
};

export type ITask = {
  id: string;
  note_id: string;
  user_id: string;
  name: string;
  date: Date;
  reminder: Date;
  duration?: string;
  calendar_id?: string;
  location?: any;
  createdAt: Date;
  updatedAt: Date;
};

export type IEmailDraft = {
  status: "pending" | "processing" | "sent" | "failed";
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: {
    fileName: string;
    fileUrl: string;
  }[];
};

export type ICollaboratorPermission = "read" | "write";

export type IAgent = {
  id: string;
  note_id: string;
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
};
export type ICollaborator = {
  id: string;
  note_id: string;
  user_id: string;
  permission: ICollaboratorPermission;
  createdAt: Date;
  updatedAt: Date;
};
export type IPagination = {
  page: number;
  page_size: number;
};
export type IApiResponse<T> = {
  status: "ok" | "err";
  data?: T;
  message?: string;
  error_code?: ErrorCodes;
};

export interface IPaginatedResponse<IRow>
  extends IApiResponse<{
    rows: IRow[];
    pagination: IPagination;
  }> {}

export interface INoteCreator {
  title: string;
  content: string;
  hidden: boolean;
  willSelfDestroy: boolean;
  secret: string;
  selfDestroyTime: string;
  draft_id: number | null;
  createdAt: Date;
  selectedUser: _IUser;
}

export type IOtpSession = {
  expiry: string | Date;
  email: string;
  auth_code_hash: string;
};

export type IAuthSession = {
  expiry: Date | string;
  ip_address: string | any;
  user_agent: string;
  user_id: string;
  socket_auth_hash: string;
};
export type IncomingNote = {
  self_destroy_time: string;
  content: string;
  title: string;
};
export interface INoteEditor {
  id: string;
  title: string;
  content: string;
  willSelfDestroy?: boolean;
  user_id: string;
  selfDestroyTime?: Date;
  createdAt: Date;
}
export type IOtpExpiry = {
  expiry: string;
  user_id: string;
  name: string;
  is_valid_auth: boolean;
};
declare module "express" {
  interface Response {
    json<DataType = any>(body: IApiResponse<DataType>): this;
  }
}
declare global {
  namespace Express {
    export interface Request {
      __user__?: {
        id: string;
      };
      __note?: {
        id: string;
      };
      __pagination__?: {
        page: number;
        page_size: number;
        offset: number;
      };
      __collaborator_permission__: {
        existingPermissionHierarchy: number;
        incomingPermissionHierarchy: number;
      };
    }
  }
}
export enum ErrorCodes {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  CONFLICT = "CONFLICT",
  PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  PAYMENT_VERIFICATION_FAILED = "PAYMENT_VERIFICATION_FAILED",
}

// Email Drafting Job
type IEmailDraftJob = {
  job_type: "email_draft";
  payload: {
    recipient: string;
    subject: string;
    body: string;
    draft_id?: string; // Optional if saving draft
  };
};

export type ISummaryResponse = {
  summary: string;
  summary_id: string;
};

export type ICloudflareResponse<T> = {
  result: T;
  success: boolean;
  errors: [];
  messages: [];
};
export type ITranscriptionInfo = {
  language: string; // The language of the audio being transcribed or translated.
  language_probability: number; // Confidence level of detected language (0 to 1).
  duration: number; // Total duration of the original audio file (in seconds).
  duration_after_vad: number; // Duration after applying VAD (in seconds).
  text: string; // Complete transcription of the audio.
  word_count: number; // Total number of words in the transcription.
  segments: ISegment[]; // List of segments in the transcription.
};

export type ISegment = {
  start: number; // Starting time of the segment (in seconds).
  end: number; // Ending time of the segment (in seconds).
  text: string; // Transcription of the segment.
  temperature: number; // Temperature used in the decoding process.
  avg_logprob: number; // Average log probability of predictions for words in the segment.
  compression_ratio: number; // Compression ratio of input to output text.
  no_speech_prob: number; // Probability that the segment contains no speech (0 to 1).
  words: IWord[]; // List of words in the segment.
};

export type IWord = {
  word: string; // Individual word transcribed from the audio.
  start: number; // Starting time of the word (in seconds).
  end: number; // Ending time of the word (in seconds).
  vtt: string; // Word in WebVTT format (timing and text).
};

export type IWhisperTurboResponse = {
  transcription_info: ITranscriptionInfo;
  text: string;
  word_count: number;
  segments: ISegment;
  vtt: string;
};

export type IWhisperResponse = {
  text: string;
  word_count: number;
  words: { word: string; start: number; end: number }[];
};
