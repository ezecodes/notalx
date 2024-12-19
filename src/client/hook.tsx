import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  _IAlias,
  IApiResponse,
  INote,
  INoteCreator,
  IOtpExpiry,
} from "../type";
import { fetchAliasNotes } from "./utils";

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
  setOtpExpiry: Dispatch<React.SetStateAction<IOtpExpiry | null>>;
  otpExpiry: IOtpExpiry | null;
  getOTPExpiry: () => void;

  selectedNotes: INote[];

  fetchNotes: (aliasId?: string) => void;
  deleteNote: (noteId: string) => void;
};
const key = "drafts";

const GlobalContext = createContext<IContext | null>(null);
const Provider: FC<{ children: ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<Partial<INoteCreator>[] | null>([]);
  const [draftCount, setDraftCount] = useState<number>(0);
  const [selectedNotes, setSelectedNotes] = useState<INote[]>([]);
  const [selectedAlias, setSelectedAlias] = useState<_IAlias | null>(null);

  const [editor, setEditor] = useState<Partial<INoteCreator>>({
    title: "",
    content: "",
    hidden: false,
    willSelfDestroy: false,
    draft_id: null,
  });
  const [otpExpiry, setOtpExpiry] = useState<IOtpExpiry | null>(null);

  const deleteNote = async (id: string) => {
    const e = prompt(
      "Are you sure ? Type the note title and click yes to confirm"
    );
    if (!e) return;

    const f = await fetch("/api/note/delete", { method: "delete" });
    const response: IApiResponse<null> = await f.json();

    alert(response.message);

    if (response.status === "ok") {
      const notes = selectedNotes;
      const index = selectedNotes.findIndex((i) => i.id === id);
      notes.splice(index, 1);
      setSelectedNotes(notes);
    }
  };

  const fetchNotes = (aliasId?: string) => {
    if (!aliasId || aliasId === undefined) return;
    fetchAliasNotes(aliasId).then((res) => {
      if (res.status === "ok" && res.data) {
        setSelectedNotes(res.data.notes);
        setSelectedAlias(res.data.alias);
      }
    });
  };

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
  const getOTPExpiry = async () => {
    const f = await fetch("/api/otp/expiry");
    const response: IApiResponse<IOtpExpiry> = await f.json();
    if (response.status === "ok") {
      setOtpExpiry(response.data!);
      return response.data;
    } else {
      return null;
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
    getOTPExpiry,

    otpExpiry,
    setOtpExpiry,
    selectedNotes,
    fetchNotes,
    deleteNote,
  };

  return (
    <GlobalContext.Provider value={contextValues}>
      {children}
    </GlobalContext.Provider>
  );
};
export { GlobalContext, Provider };
