export type IAlias = {
  id: string;
  name: string;
  email: string;
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
  self_destroy_time: string;
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
  errors?: { field: string; code: string; message?: string }[];
};

export interface IPaginatedResponse<T>
  extends IApiResponse<{
    rows: T[];
    pagination: IPagination;
  }> {}
