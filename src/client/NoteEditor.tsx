import { FC, useContext, useEffect, useRef, useState } from "react";
import { Button, InputWithIcon, SearchDropdown } from "./component";
import { ImCancelCircle, ImInfo } from "react-icons/im";
import { IoPencilOutline } from "react-icons/io5";
import { IoIosTimer } from "react-icons/io";
import ReactQuill from "react-quill";
import { Link, useNavigate } from "react-router-dom";
import { IAlias, IEditor } from "../type";
import { CiLock } from "react-icons/ci";
import { AiOutlineDelete } from "react-icons/ai";
import { FaExpand } from "react-icons/fa";
import { GlobalContext } from "./hook";
import { formatRelativeTime } from "./utils";
import { RiDraftLine } from "react-icons/ri";

const Editor = () => {
  const navigate = useNavigate();
  const {
    editor,
    setEditor,
    saveToStore,
    draftCount,
    loadDrafts,
    deleteDraft,
  } = useContext(GlobalContext)!;
  const hasCalled = useRef(false);

  const [isDraftModalOpen, setDraftModal] = useState(true);

  useEffect(() => {
    if (!hasCalled.current) {
      loadDrafts();

      hasCalled.current = true;
    }
  }, []);
  const handleUpdate = (values: Partial<IEditor>) => {
    const data = { ...editor, ...values };
    if (!editor.draft_id || editor.draft_id === undefined) {
      data.draft_id = Date.now();
      data.createdAt = new Date();
    }
    setEditor(data);
    saveToStore(data);
  };

  const handleNoteUpload = async ({
    alias_id,
    secret,
  }: {
    alias_id: string;
    secret?: string;
  }) => {
    const f = await fetch("/api/note", {
      method: "post",
      body: JSON.stringify({
        note: {
          title: editor.title,
          content: editor.content,
          is_hidden: editor.hidden,
          self_destroy_time: editor.selfDestoryTime,
          will_self_destroy: editor.willSelfDestroy,
          secret,
        },

        alias_id,
      }),
      headers: {
        "content-type": "application/json",
      },
    });
    const response = await f.json();
    deleteDraft(editor.draft_id!);
    alert(response.message);
  };

  return (
    <>
      <div className="modal animate__animated animate__slideInDown relative">
        <header className="absolute top-[10px] right-[10px]">
          {draftCount > 0 && (
            <Button
              text="Draft"
              icon={<RiDraftLine />}
              onClick={() => setDraftModal(true)}
            />
          )}
        </header>
        <form className="min-w-[300px] relative gap-y-3 flex flex-col shadow-md px-3 my-5 py-3">
          <h3 className="text-[1.3rem] font-[500]">Creating note</h3>

          <div className="absolute right-0">
            <Button
              text="Close"
              icon={<ImCancelCircle />}
              onClick={() => navigate("/")}
            />
          </div>

          <fieldset className="flex flex-col gap-y-3">
            <div>
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
          <fieldset className="flex gap-x-4 justify-end ">
            <button
              className={`primary_button ${
                editor.willSelfDestroy ? "text-green-400" : "gray-300"
              } `}
              onClick={() =>
                handleUpdate({ willSelfDestroy: !editor.willSelfDestroy })
              }
              type={"button"}
            >
              Self destruct <IoIosTimer />
            </button>

            <button
              className={`primary_button ${
                editor.hidden ? "text-green-400" : "gray-300"
              } `}
              onClick={() => handleUpdate({ hidden: !editor.hidden })}
              type={"button"}
            >
              Mark as hidden <CiLock />
            </button>

            <Button
              text="Save note"
              onClick={() => setEditor((prev) => ({ ...prev, isSaving: true }))}
            />
          </fieldset>
        </form>
      </div>
      <SaveModal
        isOpen={editor.isSaving!}
        handleNoteUpload={handleNoteUpload}
        isHidden={editor.hidden!}
        willSelfDestroy={editor.willSelfDestroy!}
        onClose={() => setEditor((prev) => ({ ...prev, isSaving: false }))}
      />{" "}
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
    <div className="w-full max-w-4xl mx-auto">
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
interface ISaveModal {
  onClose: () => void;
  handleNoteUpload: ({
    alias_id,
    secret,
  }: {
    alias_id: string;
    secret: string;
  }) => void;
  isOpen: boolean;
  isHidden: boolean;
  willSelfDestroy: boolean;
}
const SaveModal: FC<ISaveModal> = ({
  onClose,
  handleNoteUpload,
  isOpen,
  isHidden,
  willSelfDestroy,
}) => {
  const [info, setInfo] = useState({ secret: "", selfDestroyTime: "" });
  const [selectedAlias, setSelectedAlias] = useState<Partial<IAlias> | null>(
    null
  );
  const [secretInputType, setSecretInputType] = useState("text");

  const handleSelection = (option: Partial<IAlias> | null) => {
    setSelectedAlias(option);
  };

  if (!isOpen) return <></>;
  return (
    <div className="modal animate__animated animate__slideInDown">
      <div
        style={{ border: "1px solid #535353" }}
        className="flex mt-7 flex-col gap-y-3 relative w-[300px] sm:w-[600px] shadow-md px-5 py-5 rounded-md"
      >
        <h3 className="text-[1.1rem] font-[500]">Saving your note</h3>
        <div className="flex items-start gap-x-3 ">
          <ImInfo />
          <div className="text-gray-300 text-sm space-y-2">
            <p>
              To save your note, you need to choose an alias. If an alias is not
              available, you can create a new one{" "}
              <Link className="text-blue-200 underline" to={"/newalias"}>
                here
              </Link>
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Alias Requirement:</strong> An alias is a unique
                identifier for your note. Without it, your note cannot be saved.
              </li>
              <li>
                <strong>Hidden Notes:</strong> To mark a note as hidden, you
                must provide a secret. This ensures the note remains secure and
                accessible only to those with the secret.
              </li>
              <li>
                <strong>Self-Destruct Notes:</strong> For notes that
                self-destruct, you are required to set a timer. This timer
                determines when the note will be permanently deleted from the
                system. Examples of valid timers: <code>2 seconds</code>,{" "}
                <code>5 minutes</code>, <code>3 hours</code>,{" "}
                <code>2 days</code>.
              </li>
            </ul>
            <p>
              Ensure you carefully set these options to manage your notes
              effectively. Missing any of these requirements may prevent your
              note from being saved or functioning as expected.
            </p>
          </div>
        </div>

        <div className="absolute right-[10px]">
          <ImCancelCircle onClick={onClose} />
        </div>

        <div className="flex flex-col gap-y-3">
          <div className="label_input">
            <label className="text-gray-400">Find your alias</label>
            <SearchDropdown
              onClick={(value) => handleSelection(value)}
              selected={selectedAlias}
            />
          </div>

          {isHidden && (
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
                value={info.secret}
                onChange={(value) =>
                  setInfo((prev) => ({ ...prev, secret: value }))
                }
              />
            </div>
          )}
          {willSelfDestroy && (
            <div className="label_input">
              <label className="text-gray-400">
                Enter a time for deleting the note
              </label>
              <InputWithIcon
                icon={<IoIosTimer />}
                placeholder="e.g 2 seconds"
                type="text"
                value={info.selfDestroyTime}
                onChange={(value) =>
                  setInfo((prev) => ({ ...prev, selfDestroyTime: value }))
                }
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            text="Proceed"
            onClick={() =>
              handleNoteUpload({
                alias_id: selectedAlias ? selectedAlias?.id! : "",
                secret: info.secret,
              })
            }
          />
        </div>
      </div>
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
    <aside className="z-[90] add_bg flex flex-col gap-y-4 absolute right-[50px] top-[50px] px-4 py-3 rounded-md w-[400px]  shadow-md add_border">
      <div className="flex justify-between items-center">
        <h3 className="font-[500]">Unsaved drafts</h3>
        <Button text="Dismis" onClick={() => closeModal()} />
      </div>
      <div className="text-gray-300 text-sm space-y-2">
        <p>
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
        <p>
          This ensures your progress is safe while giving you full control over
          managing your notes.
        </p>
      </div>
    </aside>
  );
};
