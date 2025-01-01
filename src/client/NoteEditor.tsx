import { FC, useContext, useEffect, useRef, useState } from "react";
import {
  BackButton,
  Button,
  CollaboratorsModal,
  DisplayDateCreated,
  DraftEmail,
  ExpirationInfo,
  InputWithIcon,
  IsHiddenInfo,
  ScheduledTask,
  SuggestedActionButtons,
  SummaryHistoryItem,
  SummerisedResultPane,
} from "./component";
import { IoPencilOutline } from "react-icons/io5";
import ReactQuill, { Quill } from "react-quill";
import { useNavigate, useParams } from "react-router-dom";
import {
  _IAlias,
  IApiResponse,
  IJob,
  INote,
  INoteEditor,
  ISummaryResponse,
} from "../type";
import { GlobalContext } from "./hook";
import { toast } from "react-toastify";
import { IoSettingsOutline } from "react-icons/io5";
import { RiAdminLine } from "react-icons/ri";
import { GoPeople } from "react-icons/go";
import { IoMdTime } from "react-icons/io";
import { GoLock } from "react-icons/go";
import { decodeFromBase62, summeriseSelectedText } from "./utils";
import { BsStars } from "react-icons/bs";
import { MdOutlineAutoFixHigh } from "react-icons/md";

const Settings: FC<{ setCollabModal: () => void }> = ({ setCollabModal }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();

  const displayDropdown = () => {
    setDropdownVisible((prev) => !prev); // Toggle dropdown visibility
  };
  return (
    <div className="relative ">
      {isDropdownVisible && (
        <div className="popup_child animate__bounceIn animate__animated">
          <li className="dropdown_item" onClick={setCollabModal}>
            <GoPeople /> Collaborators
          </li>
          <li className="dropdown_item" onClick={() => navigate("/notes")}>
            <IoMdTime /> Set expiration
          </li>
          <li className="dropdown_item" onClick={() => navigate("/notes")}>
            <GoLock /> Mark as hidden
          </li>
        </div>
      )}
      <Button text="" icon={<IoSettingsOutline />} onClick={displayDropdown} />
    </div>
  );
};

const Editor = () => {
  const [editor, setEditor] = useState<INoteEditor | null>(null);
  const [showCollabModal, setCollabModal] = useState<boolean>(false);
  const params = useParams<{ note_slug: string }>();
  const hasCalled = useRef(false);
  const { otpExpiry } = useContext(GlobalContext)!;
  const handleUpdate = (values: Partial<INoteEditor>) => {
    const data = { ...editor, ...values };

    setEditor(data as INoteEditor);
  };

  const [currentInsertion, setCurrentInsertion] =
    useState<ISummaryResponse | null>(null);

  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    summary: false,
  });
  const parsedNoteId = useRef(decodeFromBase62(params.note_slug!));

  const [highlightedText, setHighlightedText] = useState<{
    text: string;
    start_index: number;
    end_index: number;
  } | null>(null);

  const fetchAllJobsInNote = async () => {
    const f = await fetch(`/api/note/${parsedNoteId.current}/job`);
    const response: IApiResponse<{ rows: IJob[] }> = await f.json();

    response.data && setJobs(response.data.rows);
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
      hidden: note.is_hidden,
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
      fetchAllJobsInNote();
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

  const handleSummariseAction = async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, summary: true }));
      const response = await summeriseSelectedText(
        parsedNoteId.current,
        highlightedText!
      );
      if (response.status === "err") {
        toast.error(response.message!);
        return;
      }

      setCurrentInsertion(response.data!);
    } finally {
      setLoadingStates((prev) => ({ ...prev, summary: false }));
    }
  };

  const quillRef = useRef<ReactQuill | null>(null);
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [previewRange, setPreviewRange] = useState<{
    start: number;
    end: number;
    originalText: string;
    previewText: string;
  } | null>(null);

  const handleSelectionChange = (selection: any, source: any, editor: any) => {
    console.log(selection);
    if (selection && selection.length > 0) {
      const selectedText = editor.getText(selection.index, selection.length);
      setHighlightedText({
        start_index: selection.index!,
        end_index: selection.length,
        text: selectedText,
      });
    } else {
      setHighlightedText(null);
    }
  };

  const replaceText = (start: number, end: number, newValue: string) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.deleteText(start, end - start);
      editor.insertText(start, newValue);
    }
  };
  useEffect(() => {
    if (currentInsertion) {
      const { new_content, old_content, end_index, start_index } =
        currentInsertion;

      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const originalText = editor.getText(
          start_index,
          end_index - start_index
        );

        // Save original text and show preview
        setPreviewRange({
          start: start_index,
          end: end_index,
          originalText,
          previewText: new_content,
        });
        setPopupVisible(true);
      }
    } else {
      setPreviewRange(null);
      setPopupVisible(false);
    }
  }, [currentInsertion]);

  const handleInsert = () => {
    if (currentInsertion) {
      const { start_index, end_index, new_content } = currentInsertion;
      replaceText(start_index, end_index, new_content);
      setPopupVisible(false);
      setPreviewRange(null);
    }
  };

  const handleCopy = () => {
    if (currentInsertion) {
      navigator.clipboard.writeText(currentInsertion.new_content);
    }
    return;
  };

  const handleDiscard = () => {
    if (previewRange) {
      const { start, end, originalText } = previewRange;

      // Restore original text in the preview range
      replaceText(start, end, originalText);

      // Clear preview
      setPopupVisible(false);
      setPreviewRange(null);
    }
  };
  const clearSelection = () => {
    const quill = quillRef!.current!.getEditor(); // Get the Quill editor instance
    const cursorPosition = quill.getSelection()?.index || 0; // Get the cursor position or default to 0
    quill.setSelection(cursorPosition, 0); // Clear the selection by setting range length to 0
  };
  // Apply preview text
  useEffect(() => {
    if (quillRef.current && previewRange) {
      const { start, end, previewText } = previewRange;
      const editor = quillRef.current.getEditor();

      // Temporarily format preview text
      editor.formatText(start, end - start, { background: "#32eb0457" });
      editor.deleteText(start, end - start);
      editor.insertText(start, previewText, { background: "#32eb0457" });
    }
  }, [previewRange]);

  if (!otpExpiry?.is_valid_auth) return <></>;

  return (
    <>
      <div className="modal  note_manager pb-5">
        <div className="modal_child">
          <form className="    gap-y-3 flex flex-col  ">
            <BackButton text={"Editing note"} url={"/"} />

            {editor ? (
              <>
                <fieldset className="flex flex-col gap-y-3 items-end ">
                  <div className="flex gap-x-4 flex-wrap gap-y-2 items-center justify-end  ">
                    <ExpirationInfo
                      time={editor.selfDestroyTime}
                      willSelfDestroy={editor.willSelfDestroy}
                    />
                    <IsHiddenInfo hidden={editor.hidden} />
                    <DisplayDateCreated date={editor.createdAt} />{" "}
                    <Settings setCollabModal={() => setCollabModal(true)} />
                  </div>
                </fieldset>
                <fieldset className="flex flex-col gap-y-3 mt-4">
                  <div className="note_title">
                    <InputWithIcon
                      icon={<IoPencilOutline />}
                      placeholder="Enter note title"
                      type="text"
                      value={editor.title!}
                      onChange={(value) => handleUpdate({ title: value })}
                    />
                  </div>
                  <div>
                    <div className="w-full max-w-4xl mx-auto note_body">
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
                      {popupVisible && (
                        <div className="w-[200px] flex items-center h-[40px] bg-[#2c2c2c] shadow-sm px-3 justify-center gap-x-2">
                          <button
                            className="sp_buttons insert"
                            onClick={handleInsert}
                          >
                            Insert
                          </button>
                          <button
                            className="sp_buttons discard"
                            onClick={handleDiscard}
                          >
                            Discard
                          </button>
                          <button className="sp_buttons" onClick={handleCopy}>
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </fieldset>
                <fieldset className="flex flex-col gap-y-3 items-end ">
                  <div className="flex gap-x-4  gap-y-2 justify-end relative items-center w-full  ">
                    <div className="absolute left-0 top-0">
                      <SuggestedActionButtons
                        email={() => {
                          // callJobAction("email", highlightedText)
                        }}
                        highlightedText={highlightedText?.text!}
                        prioritize={() => {
                          // callJobAction("prioritize", highlightedText)
                        }}
                        schedule={() => {
                          // callJobAction("schedule", highlightedText)
                        }}
                        summerise={handleSummariseAction}
                        todo={() => {}}
                        loadingStates={loadingStates}
                      />
                    </div>
                    <Button
                      text="Save note"
                      onClick={() => handleNoteUpload(editor.id)}
                    />
                  </div>
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
          <div className="mt-14 flex flex-col gap-y-3 w-full justify-start">
            <h3 className="text-sm subtext">Edit History</h3>

            {jobs.length > 0 &&
              jobs.map((job) => {
                if (job.job.job_type === "summarisation") {
                  return (
                    <SummaryHistoryItem handleInsert={() => {}} job={job} />
                  );
                }
                return <></>;
              })}

            {/* <DraftEmail />
            <ScheduledTask /> */}
          </div>
        </div>{" "}
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
