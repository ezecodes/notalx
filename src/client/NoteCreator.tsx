import { FC, useContext, useEffect, useRef, useState } from "react";
import { BackButton, Button, InputWithIcon } from "./component";
import { IoPencilOutline } from "react-icons/io5";
import { IoIosTimer } from "react-icons/io";
import ReactQuill from "react-quill";
import { _IAlias, IApiResponse, INoteCreator } from "../type";
import { CiLock } from "react-icons/ci";
import { AiOutlineDelete } from "react-icons/ai";
import { FaCheck, FaExpand } from "react-icons/fa";
import { GlobalContext } from "./hook";
import { formatRelativeTime } from "./utils";
import { MdRadioButtonUnchecked } from "react-icons/md";
import { toast } from "react-toastify";

const Editor = () => {
  const { editor, setEditor, saveToStore, loadDrafts, deleteDraft } =
    useContext(GlobalContext)!;
  const hasCalled = useRef(false);

  const [isDraftModalOpen, setDraftModal] = useState(false);

  useEffect(() => {
    if (!hasCalled.current) {
      loadDrafts();

      hasCalled.current = true;
    }
  }, []);
  const handleUpdate = (values: Partial<INoteCreator>) => {
    const data = { ...editor, ...values };
    if (!editor.draft_id || editor.draft_id === undefined) {
      data.draft_id = Date.now();
      data.createdAt = new Date();
    }
    setEditor(data);
    saveToStore(data);
  };

  const handleNoteUpload = async () => {
    const f = await fetch("/api/note", {
      method: "post",
      body: JSON.stringify({
        title: editor.title,
        content: editor.content,
        is_hidden: editor.hidden,
        self_destroy_time: editor.selfDestroyTime,
        will_self_destroy: editor.willSelfDestroy,
        secret: editor.secret,
      }),
      headers: {
        "content-type": "application/json",
      },
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      toast.success(response.message);
      deleteDraft(editor.draft_id!);
      document.location.href = "/";
    }
  };

  return (
    <>
      <div className="modal  note_manager relative">
        <form className="modal_child relative gap-y-3 flex flex-col ">
          <BackButton text={"Creating note"} url={-1} />
          <span
            onClick={() => setDraftModal(true)}
            className="tex-sm subtext cursor-pointer text-underline text-right"
          >
            Open saved drafts
          </span>

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
              <NoteEditor
                value={editor.content ?? ""}
                onChange={(value) => handleUpdate({ content: value })}
              />
            </div>
          </fieldset>

          <fieldset className="flex gap-x-4 flex-wrap gap-y-2 justify-end  ">
            <button
              className={`sub_button ${
                editor.willSelfDestroy ? "success_text" : "subtext"
              } `}
              onClick={() =>
                handleUpdate({ willSelfDestroy: !editor.willSelfDestroy })
              }
              type={"button"}
            >
              Auto delete
              {editor.willSelfDestroy ? (
                <FaCheck />
              ) : (
                <MdRadioButtonUnchecked />
              )}
            </button>
          </fieldset>

          <fieldset
            className="mt-4 pt-4 block"
            style={{ borderTop: "1px solid #3d3d3d" }}
          >
            <div className="flex flex-col gap-y-3   ">
              <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6">
                {editor.willSelfDestroy && (
                  <div className="label_input">
                    <label className="subtext">
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
          </fieldset>

          <fieldset className="flex justify-end ">
            <Button text="Save note" onClick={handleNoteUpload} />
          </fieldset>
        </form>
      </div>

      <Drafts
        closeModal={() => setDraftModal(false)}
        isOpen={isDraftModalOpen}
      />
    </>
  );
};
export default Editor;

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ value, onChange }) => {
  return (
    <div className="w-full max-w-4xl mx-auto add_border rounded-md note_body">
      <ReactQuill
        value={value}
        onChange={onChange}
        theme="snow" // 'snow' is the default theme, you can customize it as per your need
        modules={{
          toolbar: [
            [{ header: "1" }, { header: "2" }, { font: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["bold", "italic", "underline", "strike"],
            [{ align: [] }],
            ["link"],
            [{ color: [] }, { background: [] }],
            ["image"],
            ["clean"], // This is to clear the formatting
          ],
        }}
        placeholder="Write your note here..."
      />
    </div>
  );
};

interface IDraftModal {
  isOpen: boolean;
  closeModal: () => void;
}

const Drafts: FC<IDraftModal> = ({ isOpen, closeModal }) => {
  const { drafts, deleteDraft, expandDraft } = useContext(GlobalContext)!;

  if (!drafts || drafts?.length === 0 || !isOpen) return <></>;

  return (
    <aside
      className="z-[90] add_bg flex flex-col gap-y-4 sm:absolute right-[50px] top-[50px] px-4 py-3 rounded-md w-[350px] shadow-md add_border"
      style={{ backdropFilter: "blur(1px)" }}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-[500]">Unsaved drafts</h3>
        <Button text="Dismis" onClick={() => closeModal()} />
      </div>
      <div className="text-gray-300 text-sm space-y-2">
        <p className=" text-sm ">
          You have an existing unsaved draft. This draft will remain saved for
          you to revisit later unless you choose to delete it manually.
        </p>

        <div className="gap-y-2 my-3 flex flex-col">
          {drafts!.map((i) => {
            return (
              <div
                key={i.draft_id}
                className="add_border h-[100px] flex flex-col gap-y-1 px-3 py-2"
              >
                <span className="text-white">{i.title!}</span>
                <span
                  dangerouslySetInnerHTML={{ __html: i.content! }}
                  className="h-[60%] hover:bg-[#292929] duration-200 cursor-pointer"
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                />
                <div className="flex gap-x-2 items-center justify-end   mt-3">
                  <span> {formatRelativeTime(i.createdAt!)} </span>

                  <button
                    className="draft_actions"
                    onClick={() => deleteDraft(i.draft_id!)}
                  >
                    <AiOutlineDelete />
                  </button>
                  <button
                    className="draft_actions"
                    onClick={() => expandDraft(i.draft_id!)}
                  >
                    <FaExpand />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-sm ">
          This ensures your progress is safe while giving you full control over
          managing your notes.
        </p>
      </div>
    </aside>
  );
};
