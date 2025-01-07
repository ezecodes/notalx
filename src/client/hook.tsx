import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  useEffect,
  useState,
} from "react";
import {
  _IAlias,
  ApiFetchNote,
  IApiResponse,
  INote,
  INoteCreator,
  IOtpExpiry,
  IPaginatedResponse,
} from "../type";
import { fetchAuthAliasNotes } from "./utils";
import { toast } from "react-toastify";

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

  isOtpExpiryLoading: boolean;

  getOTPExpiry: () => void;

  selectedNotes: { collaborators: _IAlias[]; note: INote }[];

  deleteNote: (noteId: string) => void;

  Is_Authorised_Alias_Same_As_Note_Alias: (alias_id: string) => boolean;
  isAuthorised: () => boolean;
  Is_Authorised_Alias_A_Note_Collaborator: (
    collaborators: _IAlias[]
  ) => boolean;
  collaborators: null | { collaborators: _IAlias[]; note_id: string };
  setCollaborators: Dispatch<
    React.SetStateAction<null | { collaborators: _IAlias[]; note_id: string }>
  >;
  getNoteCollaborators: (note_id: string) => any;
  fetchAliasNotes: () => void;
  fetchNotesSharedWithAlias: () => void;
  notesSharedWithAlias: ApiFetchNote[];
  authAliasNotes: ApiFetchNote[];
};
const key = "drafts";

const GlobalContext = createContext<IContext | null>(null);
const Provider: FC<{ children: ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<Partial<INoteCreator>[] | null>([]);
  const [draftCount, setDraftCount] = useState<number>(0);
  const [selectedNotes, setSelectedNotes] = useState<ApiFetchNote[]>([]);
  const [selectedAlias, setSelectedAlias] = useState<_IAlias | null>(null);
  const [collaborators, setCollaborators] = useState<null | {
    collaborators: _IAlias[];
    note_id: string;
  }>(null);

  const [editor, setEditor] = useState<Partial<INoteCreator>>({
    title: "",
    content: "",
    willSelfDestroy: false,
    draft_id: null,
  });
  const [otpExpiry, setOtpExpiry] = useState<IOtpExpiry | null>(null);
  const [authAliasNotes, setAuthAliasNotes] = useState<ApiFetchNote[]>([]);
  const [notesSharedWithAlias, setNotesSharedWithAlias] = useState<
    ApiFetchNote[]
  >([]);
  const [isOtpExpiryLoading, setOtpExpiryLoading] = useState(true);

  useEffect(() => {
    getOTPExpiry();
  }, []);

  const deleteNote = async (id: string) => {
    const e = prompt("Are you sure ? Type yes to confirm");
    if (!e || e !== "yes") {
      alert("Aborted");
      return;
    }

    const f = await fetch(`/api/note/${id}`, { method: "delete" });
    const response: IApiResponse<null> = await f.json();

    alert(response.message);

    if (response.status === "ok") {
      const notes = selectedNotes;
      const index = selectedNotes.findIndex((i) => i.note.id === id);
      notes.splice(index, 1);
      setSelectedNotes(notes);

      document.location.href = "/";
    }
  };

  async function getNoteCollaborators(note_id: string) {
    const f = await fetch(`/api/note/${note_id}/collaborators`);
    const response: IApiResponse<{ rows: _IAlias[] }> = await f.json();

    response.status === "ok" &&
      setCollaborators({ note_id, collaborators: response.data!.rows });
  }

  const fetchAliasNotes = () => {
    fetchAuthAliasNotes().then((res) => {
      if (res.status === "ok" && res.data) {
        setAuthAliasNotes(res.data.rows);
      }
    });
  };

  const fetchNotesSharedWithAlias = async () => {
    const f = await fetch("/api/note/shared");
    const res: IPaginatedResponse<ApiFetchNote> = await f.json();

    res.status == "ok" && setNotesSharedWithAlias(res.data?.rows!);
  };

  const loadDrafts = () => {
    const drafts = localStorage.getItem(key);

    if (!drafts) {
      return;
    }

    let parse = JSON.parse(drafts);
    if (Array.isArray(parse)) {
      setDrafts(parse);
      setDraftCount(parse.length);
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
    try {
      const f = await fetch("/api/otp/expiry");
      const response: IApiResponse<IOtpExpiry> = await f.json();
      if (response.status === "ok") {
        setOtpExpiry(response.data!);
        return response.data;
      } else {
        return null;
      }
    } finally {
      setOtpExpiryLoading(false);
    }
  };

  const Is_Authorised_Alias_Same_As_Note_Alias = (alias_id: string) => {
    if (otpExpiry?.is_valid_auth && alias_id === otpExpiry.alias_id)
      return true;
    return false;
  };

  const Is_Authorised_Alias_A_Note_Collaborator = (
    collaborators: _IAlias[]
  ) => {
    if (!isAuthorised() || collaborators.length === 0) return false;
    const find = collaborators.find((i) => otpExpiry?.alias_id === i.id);
    if (!find) return false;
    return true;
  };

  const isAuthorised = () => {
    if (otpExpiry?.is_valid_auth) return true;
    return false;
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
    Is_Authorised_Alias_Same_As_Note_Alias,
    isAuthorised,

    otpExpiry,
    setOtpExpiry,
    selectedNotes,
    deleteNote,
    Is_Authorised_Alias_A_Note_Collaborator,
    getNoteCollaborators,
    collaborators,
    setCollaborators,
    fetchAliasNotes,
    authAliasNotes,
    isOtpExpiryLoading,
    fetchNotesSharedWithAlias,
    notesSharedWithAlias,
  };

  return (
    <GlobalContext.Provider value={contextValues}>
      {children}
    </GlobalContext.Provider>
  );
};
export { GlobalContext, Provider };
