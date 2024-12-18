import { FC, useContext, useEffect, useRef, useState } from "react";
import { Button, InputWithIcon, SearchDropdown } from "./component";
import { ImCancelCircle, ImInfo } from "react-icons/im";
import { IoPencilOutline } from "react-icons/io5";
import { IoIosTimer } from "react-icons/io";
import ReactQuill from "react-quill";
import { Link, useNavigate, useParams } from "react-router-dom";
import { _IAlias, IApiResponse, INote, INoteEditor } from "../type";
import { CiLock } from "react-icons/ci";
import { AiOutlineDelete } from "react-icons/ai";
import { FaCheck, FaExpand } from "react-icons/fa";
import { GlobalContext } from "./hook";
import { encodeToBase62, formatRelativeTime } from "./utils";
import { RiDraftLine } from "react-icons/ri";
import { MdRadioButtonUnchecked } from "react-icons/md";
import { VscLock } from "react-icons/vsc";
import { TfiTimer } from "react-icons/tfi";
import { BsUnlock } from "react-icons/bs";

const Editor = () => {
  const navigate = useNavigate();
  const [editor, setEditor] = useState<INoteEditor | null>(null);
  const params = useParams<{ note_slug: string }>();
  const hasCalled = useRef(false);
  const [secretInputType, setSecretInputType] = useState("text");

  const handleUpdate = (values: Partial<INoteEditor>) => {
    const data = { ...editor, ...values };

    setEditor(data as INoteEditor);
  };

  const fetchPrevNote = async (note_slug: string) => {
    const f = await fetch("/api/note/" + note_slug);
    const response: IApiResponse<INote> = await f.json();

    if (response.status === "err") return;
    setEditor({
      content: response.data!.content,
      hidden: response.data!.is_hidden,
      title: response.data!.title,
      willSelfDestroy: response.data!.will_self_destroy,
      createdAt: response.data!.createdAt,
      id: response.data!.id,
      selfDestroyTime: response.data!.self_destroy_time,
    });
  };

  useEffect(() => {
    if (!hasCalled.current) {
      fetchPrevNote(params.note_slug!);
      hasCalled.current = true;
    }
  }, []);

  const handleNoteUpload = async (id: string) => {
    if (!editor) return;

    const f = await fetch("/api/note/edit/" + id, {
      method: "put",
      body: JSON.stringify({
        content: editor.content,
        is_hidden: editor.hidden,
        title: editor.title,
        will_self_destroy: editor.willSelfDestroy,
        self_destroy_time: editor.selfDestroyTime,
      }),
    });
    const response: IApiResponse<null> = await f.json();

    alert(response.message);
  };

  return (
    <>
      <div className="modal animate__animated animate__slideInDown relative">
        <form className="modal_child relative gap-y-3 flex flex-col  px-3 my-5 py-3">
          <h3 className="text-[1.3rem] font-[500]">Editing note</h3>

          <div className="absolute right-0">
            <Button
              text="Close"
              icon={<ImCancelCircle />}
              onClick={() => navigate("/")}
            />
          </div>

          {editor ? (
            <>
              <fieldset className="flex flex-col gap-y-3 mt-4">
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

              <fieldset className="flex gap-x-4 flex-wrap gap-y-2 justify-end  ">
                {editor.willSelfDestroy ? (
                  <button
                    className={`text-sm flex items-center gap-x-2 text-gray-300`}
                    type={"button"}
                    disabled
                  >
                    {new Date(editor.selfDestroyTime).toLocaleDateString()}
                    <TfiTimer />
                  </button>
                ) : (
                  <button
                    className={`text-sm flex items-center gap-x-2 text-gray-300`}
                    type={"button"}
                    disabled
                  >
                    No expiration
                    <TfiTimer />
                  </button>
                )}

                {editor.hidden ? (
                  <button
                    className={`text-sm flex items-center gap-x-2 text-gray-300`}
                    type={"button"}
                    disabled
                  >
                    Hidden
                    <VscLock />
                  </button>
                ) : (
                  <button
                    className={`text-sm flex items-center gap-x-2 text-gray-300`}
                    type={"button"}
                    disabled
                  >
                    Public
                    <BsUnlock />
                  </button>
                )}
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
      </div>
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
