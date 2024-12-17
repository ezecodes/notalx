import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { IEditor } from "../type";

type IContext = {
  editor: Partial<IEditor>;
  setEditor: Dispatch<React.SetStateAction<Partial<IEditor>>>;
  saveToStore: (values: Partial<IEditor>) => void;
  drafts: Partial<IEditor>[] | null;
  deleteDraft: (draft_id: number) => void;
  expandDraft: (draft_id: number) => void;
  loadDrafts: () => void;
};
const key = "drafts";

const GlobalContext = createContext<IContext | null>(null);
const Provider: FC<{ children: ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<Partial<IEditor>[] | null>([]);

  const [editor, setEditor] = useState<Partial<IEditor>>({
    title: "",
    content: "",
    hidden: false,
    willSelfDestroy: false,
    selfDestoryTime: "",
    isSaving: false,
    draft_id: null,
  });

  const loadDrafts = () => {
    const drafts = localStorage.getItem(key);
    if (drafts) {
      let parse = JSON.parse(drafts);
      if (Array.isArray(parse)) setDrafts(parse);
    }
  };

  const deleteDraft = (draft_id: number) => {
    const drafts = localStorage.getItem(key);
    let parse: Partial<IEditor>[] = JSON.parse(drafts!);
    const index = parse.findIndex((i) => (i.draft_id as number) === draft_id);
    if (index !== -1) {
      parse.splice(index, 1);
      localStorage.setItem(key, JSON.stringify(parse));
    }
  };

  const expandDraft = (draft_id: number) => {
    const drafts = localStorage.getItem(key);
    let parse: Partial<IEditor>[] = JSON.parse(drafts!);
    const index = parse.findIndex((i) => (i.draft_id as number) === draft_id);
    if (index !== -1) {
      setEditor(parse[index]);
    }
  };

  const saveToStore = (values: Partial<IEditor>) => {
    const drafts = localStorage.getItem(key);
    if (!drafts) {
      localStorage.setItem(
        key,
        JSON.stringify([{ ...editor, draft_id: Date.now() }])
      );
    } else {
      let parse: (typeof values)[] | null = JSON.parse(drafts);
      let index = parse?.findIndex((i) => i.draft_id === editor.draft_id) ?? -1;
      if (index !== -1) {
        let find = { ...parse![index], ...values };
        parse![index] = find;
        localStorage.setItem(key, JSON.stringify(parse));
      } else {
        let obj = { ...editor, ...values };
        Array.isArray(parse) ? parse.push(obj) : (parse = [obj]);
        localStorage.setItem(key, JSON.stringify(parse));
      }
    }
  };

  const contextValues = {
    editor,
    saveToStore,
    setEditor,
    drafts,
    deleteDraft,
    expandDraft,
    loadDrafts,
  };

  return (
    <GlobalContext.Provider value={contextValues}>
      {children}
    </GlobalContext.Provider>
  );
};
export { GlobalContext, Provider };
