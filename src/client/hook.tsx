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
  _IUser,
  ApiFetchNote,
  IApiResponse,
  INote,
  INoteCreator,
  INotification,
  IOtpExpiry,
  IPaginatedResponse,
  ITask,
} from "../../type";
import { fetchAuthUserNotes } from "./utils";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

type IFetchScheduledTask = { task: ITask; participants: _IUser[] };

type IContext = {
  editor: Partial<INoteCreator>;
  setEditor: Dispatch<React.SetStateAction<Partial<INoteCreator>>>;
  saveToStore: (values: Partial<INoteCreator>) => void;
  drafts: Partial<INoteCreator>[] | null;
  deleteDraft: (draft_id: number) => void;
  expandDraft: (draft_id: number) => void;
  loadDrafts: () => void;
  draftCount: number;
  selectedUser: _IUser | null;
  setSelectedUser: Dispatch<React.SetStateAction<_IUser | null>>;
  setOtpExpiry: Dispatch<React.SetStateAction<IOtpExpiry | null>>;
  otpExpiry: IOtpExpiry | null;

  isOtpExpiryLoading: boolean;

  getOTPExpiry: () => void;

  selectedNotes: { collaborators: _IUser[]; note: INote }[];

  deleteNote: (noteId: string) => void;

  Is_Authorised_User_Same_As_Note_User: (user_id: string) => boolean;
  isAuthorised: () => boolean;
  Is_Authorised_User_A_Note_Collaborator: (collaborators: _IUser[]) => boolean;
  collaborators: null | { collaborators: _IUser[]; note_id: string };
  setCollaborators: Dispatch<
    React.SetStateAction<null | { collaborators: _IUser[]; note_id: string }>
  >;
  getNoteCollaborators: (note_id: string) => any;
  fetchUserNotes: () => void;
  fetchNotesSharedWithUser: () => void;
  notesSharedWithUser: ApiFetchNote[];
  authUserNotes: ApiFetchNote[];

  fetchScheduledTasks: () => void;

  scheduledTasks: IFetchScheduledTask[];
  beginSearch: () => void;
  searchResults: ApiFetchNote[];
  searchLoading: boolean;
  searchValue: string;
  lastSearchValue: null | string;
  setSearchValue: Dispatch<React.SetStateAction<string>>;
  notifications: INotification[];
  showNotificationModal: boolean;
  setNotificationModal: Dispatch<React.SetStateAction<boolean>>;
};
const key = "drafts";

const GlobalContext = createContext<IContext | null>(null);
const Provider: FC<{ children: ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<Partial<INoteCreator>[] | null>([]);
  const [draftCount, setDraftCount] = useState<number>(0);
  const [selectedNotes, setSelectedNotes] = useState<ApiFetchNote[]>([]);
  const [selectedUser, setSelectedUser] = useState<_IUser | null>(null);
  const [collaborators, setCollaborators] = useState<null | {
    collaborators: _IUser[];
    note_id: string;
  }>(null);
  const [searchResults, setSearchResults] = useState<ApiFetchNote[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [lastSearchValue, setLastSearchValue] = useState<null | string>(null);
  const [showNotificationModal, setNotificationModal] = useState(false);

  const [scheduledTasks, setScheduledTasks] = useState<IFetchScheduledTask[]>(
    []
  );
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const fetchNotifications = async () => {
    const f = await fetch("/api/notification");
    const res: IPaginatedResponse<INotification> = await f.json();
    if (res.status === "ok") setNotifications(res.data?.rows!);
  };

  const fetchScheduledTasks = async () => {
    const f = await fetch("/api/task");
    const res: IPaginatedResponse<IFetchScheduledTask> = await f.json();

    res.status === "ok" && setScheduledTasks(res.data?.rows!);
  };

  const usersNameSpace = useRef(io("http://localhost:4000/users"));

  const [editor, setEditor] = useState<Partial<INoteCreator>>({
    title: "",
    content: "",
    willSelfDestroy: false,
    draft_id: null,
  });
  const [otpExpiry, setOtpExpiry] = useState<IOtpExpiry | null>(null);
  const [authUserNotes, setAuthUserNotes] = useState<ApiFetchNote[]>([]);
  const [notesSharedWithUser, setNotesSharedWithUser] = useState<
    ApiFetchNote[]
  >([]);
  const [isOtpExpiryLoading, setOtpExpiryLoading] = useState(true);

  const initializeSocket = () => {
    usersNameSpace.current.on("connect", () => {
      console.log("Connected to socket server");
    });

    usersNameSpace.current.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    usersNameSpace.current.on("notification", (notification: INotification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    usersNameSpace.current.on("noteDeleted", (noteId: string) => {
      console.log("Note deleted:", noteId);
      // Handle note deletion logic here
    });
  };

  useEffect(() => {
    getOTPExpiry();
    initializeSocket();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (showNotificationModal) {
      usersNameSpace.current.emit(
        "read_notification",
        notifications.map((i) => i.id)
      );
    }
  }, [showNotificationModal]);

  const beginSearch = async () => {
    try {
      setLastSearchValue(null);
      setSearchLoading(true);
      const f = await fetch(`/api/note/search?value=${searchValue}`);
      const res: IPaginatedResponse<ApiFetchNote> = await f.json();
      if (res.status === "err") {
        toast.error(res.message);
        return;
      }
      setLastSearchValue(searchValue);
      setSearchResults(res.data!.rows);
    } finally {
      setSearchLoading(false);
    }
  };
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
    const response: IApiResponse<{ rows: _IUser[] }> = await f.json();

    response.status === "ok" &&
      setCollaborators({ note_id, collaborators: response.data!.rows });
  }

  const fetchUserNotes = () => {
    fetchAuthUserNotes().then((res) => {
      if (res.status === "ok" && res.data) {
        setAuthUserNotes(res.data.rows);
      }
    });
  };

  const fetchNotesSharedWithUser = async () => {
    const f = await fetch("/api/note/shared");
    const res: IPaginatedResponse<ApiFetchNote> = await f.json();

    res.status == "ok" && setNotesSharedWithUser(res.data?.rows!);
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

  const Is_Authorised_User_Same_As_Note_User = (user_id: string) => {
    if (otpExpiry?.is_valid_auth && user_id === otpExpiry.user_id) return true;
    return false;
  };

  const Is_Authorised_User_A_Note_Collaborator = (collaborators: _IUser[]) => {
    if (!isAuthorised() || collaborators.length === 0) return false;
    const find = collaborators.find((i) => otpExpiry?.user_id === i.id);
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
    setSelectedUser,
    selectedUser,
    getOTPExpiry,
    Is_Authorised_User_Same_As_Note_User,
    isAuthorised,

    otpExpiry,
    setOtpExpiry,
    selectedNotes,
    deleteNote,
    Is_Authorised_User_A_Note_Collaborator,
    getNoteCollaborators,
    collaborators,
    setCollaborators,
    fetchUserNotes,
    authUserNotes,
    isOtpExpiryLoading,
    fetchNotesSharedWithUser,
    notesSharedWithUser,
    fetchScheduledTasks,
    scheduledTasks,
    beginSearch,
    searchResults,
    searchLoading,
    searchValue,
    lastSearchValue,
    setSearchValue,
    notifications,
    setNotificationModal,
    showNotificationModal,
  };

  return (
    <GlobalContext.Provider value={contextValues}>
      {children}
    </GlobalContext.Provider>
  );
};

type MicrophoneStatus =
  | "idle"
  | "requesting"
  | "active"
  | "recording"
  | "analyzing"
  | "error";

const useMicrophone = () => {
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]); // Store recorded audio chunks
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Ref to hold MediaRecorder instance
  const audioContextRef = useRef<AudioContext | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);

  const requestMicrophoneAccess = async () => {
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setStatus("active");
      setError(null);
    } catch (err) {
      setError(
        "Microphone access denied. Please enable microphone permissions in your browser."
      );
      setStatus("error");
    }
  };

  // Start recording audio
  const startRecording = () => {
    if (mediaStream) {
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log(event);
        setAudioChunks((prevChunks) => [...prevChunks, event.data]);
      };
      setTranscribedText(null);

      mediaRecorder.onstop = () => {
        // Combine all audio chunks into a single Blob when recording stops
        sendAudioToBackend();
      };

      mediaRecorder.start();
      setStatus("recording");
    }
  };

  const sendAudioToBackend = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

    const formData: any = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    try {
      setStatus("analyzing");
      const response = await fetch("/api/note/audio", {
        method: "POST",

        body: formData,
      });

      if (!response.ok) {
        console.error("Error sending file to backend:", response.statusText);
        setError("Failed to transcribe audio.");
      } else {
        const result: IApiResponse<{ words: string }> = await response.json();
        setTranscribedText(result.data!.words);
        return result;
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to connect to backend.");
    } finally {
      setStatus("active");
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setStatus("active"); // Reset the status after recording is stopped
    }
  };

  // Cleanup function when the component is unmounted or the stream changes
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mediaStream]);

  return {
    status,
    error,
    mediaStream,
    requestMicrophoneAccess,
    startRecording,
    stopRecording,
    transcribedText,
  };
};
export { GlobalContext, Provider, useMicrophone };
