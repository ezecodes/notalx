export type Alias = {
  id: string;
  name: string;
  secret: string;
  email: string;
};
export type Note = {
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
