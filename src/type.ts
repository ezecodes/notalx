export type Alias = {};
export type Note = {
  id: string;
  title: string;
  content: string;
};
export interface ICreateNote {
  alias: {
    name: string;
    secret: string;
  };
  note: {
    content: string;
    title: string;
    hidden: boolean;
  };
}
