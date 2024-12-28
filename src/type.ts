export type IAlias = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type _IAlias = {
  id: string;
  name: string;
  email?: string;
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
  slug: string;
  secret: string;
  is_hidden: boolean;
  will_self_destroy: boolean;
  self_destroy_time: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiFetchNote = {
  collaborators: _IAlias[];
  note: INote;
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
  alias_id: string;
  auth_code_hash: string;
};

export type IAuthSession = {
  expiry: Date | string;
  ip_address: string;
  user_agent: string;
  alias_id: string;
};
export type IncomingNote = {
  self_destroy_time: string;
  content: string;
  title: string;
  is_hidden: boolean;
  secret: string;
  will_self_destroy: boolean;
};
export interface INoteEditor {
  id: string;
  title: string;
  content: string;
  hidden: boolean;
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
}
