import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { _IAlias, INoteCreator } from "../type";

type IContext = {
  editor: Partial<INoteCreator>;
  setEditor: Dispatch<React.SetStateAction<Partial<INoteCreator>>>;
  saveToStore: (values: Partial<INoteCreator>) => void;
  drafts: Partial<INoteCreator>[] | null;
  deleteDraft: (draft_id: number) => void;
  expandDraft: (draft_id: number) => void;
  loadDrafts: () => void;
  draftCount: number;
  selectedAlias: _IAlias | null;
  setSelectedAlias: Dispatch<React.SetStateAction<_IAlias | null>>;
};
const key = "drafts";

const GlobalContext = createContext<IContext | null>(null);
const Provider: FC<{ children: ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<Partial<INoteCreator>[] | null>([]);
  const [draftCount, setDraftCount] = useState<number>(0);

  const [editor, setEditor] = useState<Partial<INoteCreator>>({
    title: "",
    content: "",
    hidden: false,
    willSelfDestroy: false,
    draft_id: null,
  });

  const [selectedAlias, setSelectedAlias] = useState<_IAlias | null>(null);

  const loadDrafts = () => {
    const drafts = localStorage.getItem(key);
    if (drafts) {
      let parse = JSON.parse(drafts);
      if (Array.isArray(parse)) {
        setDrafts(parse);
        setDraftCount(parse.length);
      }
    }
  };

  const deleteDraft = (draft_id: number) => {
    const drafts = localStorage.getItem(key);
    let parse: Partial<INoteCreator>[] = JSON.parse(drafts!);
    const index = parse.findIndex((i) => (i.draft_id as number) === draft_id);

    if (index !== -1) {
      parse.splice(index, 1);
      localStorage.setItem(key, JSON.stringify(parse));
      setDrafts(parse);
    }
  };

  const expandDraft = (draft_id: number) => {
    const drafts = localStorage.getItem(key);
    let parse: Partial<INoteCreator>[] = JSON.parse(drafts!);
    const index = parse.findIndex((i) => (i.draft_id as number) === draft_id);
    if (index !== -1) {
      setEditor(parse[index]);
    }
  };

  const saveToStore = (values: Partial<INoteCreator>) => {
    if (!values.title) return;
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
    draftCount,
    setSelectedAlias,
    selectedAlias,
  };

  return (
    <GlobalContext.Provider value={contextValues}>
      {children}
    </GlobalContext.Provider>
  );
};
export { GlobalContext, Provider };
