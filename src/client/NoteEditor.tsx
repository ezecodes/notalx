import { FC, useContext, useEffect, useRef, useState } from "react";
import {
  BackButton,
  Button,
  CollaboratorsModal,
  DisplayDateCreated,
  ExpirationInfo,
  InputWithIcon,
  RingsLoader,
  ScheduledTasksWrapper,
  SuggestedActionButtons,
} from "./component";
import { IoPencilOutline } from "react-icons/io5";
import ReactQuill, { Range } from "react-quill";
import { useNavigate, useParams } from "react-router-dom";
import {
  _IAlias,
  IApiResponse,
  INote,
  INoteEditor,
  ISummaryResponse,
  ITask,
} from "../type";
import { GlobalContext } from "./hook";
import { toast } from "react-toastify";
import { IoSettingsOutline } from "react-icons/io5";
import { GoPeople } from "react-icons/go";
import {
  decodeFromBase62,
  createScheduleTask,
  summeriseSelectedText,
} from "./utils";
import { BsStars } from "react-icons/bs";
import { CiCircleChevDown, CiStickyNote } from "react-icons/ci";

const Settings: FC<{ setCollabModal: () => void }> = ({ setCollabModal }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const displayDropdown = () => {
    setDropdownVisible((prev) => !prev); // Toggle dropdown visibility
  };
  return (
    <div className="relative ">
      <Button text="" icon={<IoSettingsOutline />} onClick={displayDropdown} />
      <div
        className={`popup_child animate__animated ${
          isDropdownVisible
            ? "animate__zoomIn visible opacity-1"
            : "animate__zoomOut invisible opacity-0"
        }`}
      >
        <li
          className="dropdown_item"
          style={{ borderBottom: "5px solid #2121218c" }}
          onClick={setCollabModal}
        >
          <GoPeople /> Manage Collaborators
        </li>
        <li
          className="dropdown_item"
          style={{}}
          onClick={() => navigate("/newnote")}
        >
          <CiStickyNote /> New Note
        </li>
      </div>
    </div>
  );
};

type IHighlightedText = {
  text: string;
  start_index: number;
  end_index: number;
};

const Editor = () => {
  const [editor, setEditor] = useState<INoteEditor | null>(null);
  const [showCollabModal, setCollabModal] = useState(false);
  const params = useParams<{ note_slug: string }>();
  const hasCalled = useRef(false);
  const { otpExpiry } = useContext(GlobalContext)!;
  const handleUpdate = (values: Partial<INoteEditor>) => {
    const data = { ...editor, ...values };

    setEditor(data as INoteEditor);
  };

  const [currentJobTab, setCurrentJobTab] = useState<"task" | "email" | "all">(
    "task"
  );

  const [tasks, setTasks] = useState<
    { task: ITask; participants: _IAlias[] }[]
  >([]);
  const [loadingStates, setLoadingStates] = useState({
    summary: false,
    task: false,
  });
  const parsedNoteId = useRef(decodeFromBase62(params.note_slug!));

  const quillRef = useRef<ReactQuill | null>(null);
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [aiActionsVisible, setAiActionsVisible] = useState<boolean>(false);

  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const [summaryResponse, setSummaryResponse] =
    useState<ISummaryResponse | null>(null);

  const [highlightedText, setHighlightedText] =
    useState<IHighlightedText | null>(null);

  const fetchAllTasksInNote = async () => {
    const f = await fetch(`/api/note/${parsedNoteId.current}/task`);
    const response: IApiResponse<{
      rows: { task: ITask; participants: _IAlias[] }[];
    }> = await f.json();

    response.data && setTasks(response.data.rows);
  };

  const fetchPrevNote = async () => {
    const f = await fetch("/api/note/" + parsedNoteId.current);
    const response: IApiResponse<{ note: INote; collaborators: _IAlias[] }> =
      await f.json();

    if (response.status === "err") {
      toast.error(response.message);
      return;
    }
    const note = response.data?.note!;
    setEditor({
      content: note.content,
      title: note.title,
      willSelfDestroy: note.will_self_destroy,
      createdAt: note.createdAt,
      id: note.id,
      selfDestroyTime: note.self_destroy_time,
      alias_id: note.alias_id,
    });
  };

  useEffect(() => {
    if (!hasCalled.current) {
      fetchPrevNote();
      fetchAllTasksInNote();

      hasCalled.current = true;
    }
  }, []);

  const handleNoteUpload = async (id: string) => {
    if (!editor) return;

    const f = await fetch("/api/note/" + id, {
      method: "put",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        content: editor.content,
        title: editor.title,
      }),
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      toast.success(response.message);
    }
  };

  const handleSummariseAction = async (summeriseAll?: boolean) => {
    if (loadingStates.task) {
      toast.error("Task scheduling is still being processed. Please wait.");
      return;
    }
    if (!highlightedText && !summeriseAll) {
      toast.error("Select text to summerise");
      return;
    }
    try {
      setLoadingStates((prev) => ({ ...prev, summary: true }));

      const response = await summeriseSelectedText(parsedNoteId.current, {
        summary_id: summaryResponse?.summary_id ?? null,
        text: editor?.content!,
      });
      if (response.status === "err") {
        toast.error(response.message!);
        return;
      }
      setSummaryResponse(response.data!);
    } finally {
      setLoadingStates((prev) => ({ ...prev, summary: false }));
    }
  };

  const handleSelectionChange = (
    selection: Range,
    source: any,
    editor: any
  ) => {
    if (selection && selection.length > 0) {
      const selectedText = editor.getText(selection.index, selection.length);
      const data = {
        end_index: selection.index + selection.length,
        start_index: selection.index!,
        text: selectedText,
      };
      setHighlightedText(data);
      handlePopupPosition();

      setAiActionsVisible(true);
    } else {
      !loadingStates.summary && setAiActionsVisible(false);
    }
  };

  useEffect(() => {
    if (summaryResponse && highlightedText) {
      const { end_index, start_index } = highlightedText;

      if (quillRef.current) {
        const editor = quillRef.current.getEditor();

        // Temporarily format preview text

        editor.deleteText(start_index, end_index - start_index);
        editor.insertText(start_index, summaryResponse.summary, {
          background: "#243c1a",
        });
        setPopupVisible(true);
      }
    } else {
      setPopupVisible(false);
    }
  }, [summaryResponse]);

  const handleInsert = () => {
    if (summaryResponse && highlightedText) {
      const { end_index, start_index } = highlightedText;

      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        editor.removeFormat(start_index, 100000);
      }
      setPopupVisible(false);
    }
  };

  const handleCopy = () => {
    if (summaryResponse) {
      navigator.clipboard
        .writeText(summaryResponse.summary!)
        .then(() => {
          toast.success("Copied");
        })
        .catch((err) => {
          console.error(err);
          toast.error(err);
        });
    }
    return;
  };

  const handleDiscard = () => {
    setPopupVisible(false);
    clearSelection();
    setSummaryResponse(null);
  };
  const clearSelection = () => {
    const quill = quillRef!.current!.getEditor(); // Get the Quill editor instance
    const cursorPosition = quill.getSelection()?.index || 0; // Get the cursor position or default to 0
    quill.setSelection(cursorPosition, 0); // Clear the selection by setting range length to 0
  };
  // Apply preview text

  const handleAiScheduling = async () => {
    if (loadingStates.summary) {
      toast.error("Summary generation is still in progress. Please wait.");
      return;
    }
    try {
      setLoadingStates((prev) => ({ ...prev, task: true }));
      const response = await createScheduleTask(
        parsedNoteId.current,
        highlightedText!
      );
      if (response.status === "err") {
        toast.error(response.message);
        return;
      }

      if (response.status === "ok") {
        toast.success(response.message);
        fetchAllTasksInNote();
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, task: false }));
    }
  };

  const handlePopupPosition = () => {
    const globalSection = window.getSelection();

    if (globalSection && globalSection.rangeCount > 0) {
      const range = globalSection.getRangeAt(0);
      const rect = range.getClientRects()[0]; // Get the precise bounding rect of the selection

      if (rect) {
        setPopupPosition({
          top: Math.min(
            rect.top + window.scrollY,
            document.body.scrollHeight - 200
          ),
          left: Math.min(
            rect.left + window.scrollX,
            document.body.scrollWidth - 200
          ),
        });
      }
    }
  };
  const performUndoTwice = () => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor(); // Get the Quill instance
      (editor as any).history.undo(); // Perform first undo
    }
  };
  const handleRefinement = () => {
    handleDiscard();
    performUndoTwice();
    setAiActionsVisible(true);

    handleSummariseAction();
  };

  const handleDraftEmail = () => {};

  if (!otpExpiry?.is_valid_auth) return <></>;

  return (
    <>
      <div className="modal  note_manager pb-5">
        <div className="modal_child">
          <form className="    gap-y-3 flex flex-col  ">
            <BackButton text={"Editing note"} onClick={() => navigate("/")} />

            {editor ? (
              <>
                <fieldset className="flex flex-col gap-y-3 items-end ">
                  <div className="flex gap-x-4 flex-wrap gap-y-2 items-center justify-end  ">
                    <ExpirationInfo
                      time={editor.selfDestroyTime}
                      willSelfDestroy={editor.willSelfDestroy}
                    />
                    <DisplayDateCreated date={editor.createdAt} />{" "}
                    <Settings setCollabModal={() => setCollabModal(true)} />
                  </div>
                </fieldset>
                <fieldset className="flex flex-col gap-y-3 mt-4">
                  <div className="note_title">
                    <InputWithIcon
                      label="Title"
                      icon={<IoPencilOutline />}
                      placeholder="Enter note title"
                      type="text"
                      value={editor.title!}
                      onChange={(value) => handleUpdate({ title: value })}
                    />
                  </div>
                  <div className="w-full max-w-4xl mx-auto add_border rounded-md note_body">
                    <ReactQuill
                      ref={quillRef}
                      value={editor.content}
                      onChange={(value) => handleUpdate({ content: value })}
                      onChangeSelection={handleSelectionChange}
                      theme="snow"
                      modules={{
                        toolbar: [
                          [{ header: "1" }, { header: "2" }, { font: [] }],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["bold", "italic", "underline", "strike"],
                          [{ align: [] }],
                          ["link"],
                          [{ color: [] }, { background: [] }],
                          ["image"],
                          ["clean"],
                        ],
                      }}
                      placeholder="Write your note here..."
                    />
                    <div
                      style={{
                        position: "fixed",
                        top: popupPosition.top - 50,
                        left: popupPosition.left,
                      }}
                      className={`z-[1000] flex-col gap-y-3 animate__animated   flex items-start py-2 bg-[#2c2c2c]  shadow-md px-3 gap-x-2 ${
                        popupVisible
                          ? "animate__zoomIn visible opacity-1"
                          : "animate__zoomOut invisible opacity-0"
                      }`}
                    >
                      <div className="flex items-center justify-start gap-x-2">
                        <button
                          className="sp_buttons insert"
                          type="button"
                          onClick={handleInsert}
                        >
                          Insert
                        </button>
                        <button
                          className="sp_buttons"
                          type="button"
                          onClick={() => {
                            handleRefinement();
                          }}
                        >
                          Refine
                        </button>
                        <button
                          className="sp_buttons discard"
                          type="button"
                          onClick={() => {
                            performUndoTwice();
                            handleDiscard();
                          }}
                        >
                          Discard
                        </button>
                        <button
                          className="sp_buttons"
                          type="button"
                          onClick={handleCopy}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        position: "fixed",
                        top: popupPosition.top - 100,
                        left: popupPosition.left,
                      }}
                      className={`${
                        aiActionsVisible
                          ? "animate__fadeIn visible opacity-1"
                          : "animate__backOutDown invisible opacity-0"
                      } z-[1000] flex-col gap-y-3 animate__animated flex items-end py-2 bg-[#2c2c2c]  shadow-md px-3 gap-x-2`}
                    >
                      <div className="flex items-center justify-start gap-x-2">
                        <BsStars className="text-yellow-200 " />
                        <Button
                          disabled={loadingStates.summary}
                          text="Summerise"
                          onClick={handleSummariseAction}
                          icon={loadingStates.summary ? <RingsLoader /> : <></>}
                        />
                        <CiCircleChevDown className="subtext " />
                      </div>
                    </div>
                  </div>
                </fieldset>
                <fieldset className="flex gap-y-3 w-full items-start justify-between ">
                  <SuggestedActionButtons
                    schedule={handleAiScheduling}
                    summerise={() => {
                      quillRef.current?.editor?.setSelection(0, 9999999999);

                      handleSummariseAction(true);
                    }}
                    loadingStates={loadingStates}
                  />
                  <Button
                    text="Save note"
                    onClick={() => handleNoteUpload(editor.id)}
                  />
                </fieldset>
                {/* <fieldset
                className="mt-4 pt-4 block"
                style={{ borderTop: "1px solid #3d3d3d" }}
              >
                <div className="flex flex-col gap-y-3   ">
                  <div className="grid sm:grid-cols-2 gap-x-6">
                    {editor.hidden && (
                      <div className="label_input">
                        <label className="text-gray-400">
                          Enter a secret for this note
                        </label>
                        <InputWithIcon
                          icon={<CiLock />}
                          focusListener={() => setSecretInputType("text")}
                          blurListener={() => setSecretInputType("password")}
                          placeholder="Enter a secret"
                          type={secretInputType}
                          value={editor.secret ?? ""}
                          onChange={(value) => handleUpdate({ secret: value })}
                        />
                      </div>
                    )}
                    {editor.willSelfDestroy && (
                      <div className="label_input">
                        <label className="text-gray-400">
                          Enter a time for deleting the note
                        </label>
                        <InputWithIcon
                          icon={<IoIosTimer />}
                          placeholder="e.g 2 seconds"
                          type="text"
                          value={editor.selfDestroyTime ?? ""}
                          onChange={(value) =>
                            handleUpdate({ selfDestroyTime: value })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </fieldset> */}
              </>
            ) : (
              <></>
            )}
          </form>
          <div className="mt-14 flex flex-col gap-y-3 pt-3 w-full border_top justify-start">
            <div className="flex items-center gap-x-2">
              <button
                className="sp_buttons"
                style={
                  currentJobTab === "task" ? { backgroundColor: "#3a3a43" } : {}
                }
                onClick={() => {
                  setCurrentJobTab("task");
                }}
              >
                Schedules
              </button>
            </div>

            {currentJobTab === "task" && <ScheduledTasksWrapper rows={tasks} />}
          </div>
        </div>
      </div>

      {showCollabModal && editor && (
        <CollaboratorsModal
          note_id={editor?.id!}
          onClose={() => setCollabModal(false)}
          note_owner_id={editor?.alias_id}
        />
      )}
    </>
  );
};

export default Editor;
