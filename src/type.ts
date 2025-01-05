export type IAlias = {
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
  alias_id: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
};

export type _IAlias = {
  id: string;
  name: string;
  email?: string;
};
export type ITaskParticipant = {
  id: string;
  task_id: string;
  alias_id: string;
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
  alias_id: string;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type INote = {
  id: string;
  title: string;
  content: string;
  alias_id: string;
  will_self_destroy: boolean;
  self_destroy_time: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiFetchNote = {
  collaborators: _IAlias[];
  note: INote;
};
export type ITask = {
  id: string;
  note_id: string;
  alias_id: string;
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

export type IAgent = {
  id: string;
  note_id: string;
  alias_id: string;
  createdAt: Date;
  updatedAt: Date;
};
export type INoteCollaborator = {
  id: string;
  note_id: string;
  alias_id: string;
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

export interface IPaginatedResponse<T>
  extends IApiResponse<{
    rows: T[];
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
  selectedAlias: _IAlias;
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
  alias_id: string;
  socket_auth_hash: string;
};
export type IncomingNote = {
  self_destroy_time: string;
  content: string;
  title: string;
  will_self_destroy: boolean;
};
export interface INoteEditor {
  id: string;
  title: string;
  content: string;
  willSelfDestroy: boolean;
  alias_id: string;
  selfDestroyTime: Date;
  createdAt: Date;
}
export type IOtpExpiry = {
  expiry: string;
  alias_id: string;
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
      __alias?: {
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
