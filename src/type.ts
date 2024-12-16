import { Optional } from "sequelize";

export type IAlias = {
  id: string;
  name: string;
  secret: string;
  email: string;
};
export interface _Alias extends Optional<IAlias, "email" | "secret"> {}

export type INote = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
export interface ICreateNote {
  title: string;
  content: string;
  hidden: boolean;
  self_destruct: boolean;
  alias_id: string;
  secret: string;
}

export interface ICreateAlias {
  name: string;
  secret?: string;
  email?: string;
}
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
