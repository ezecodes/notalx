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

const Editor = () => {
  const navigate = useNavigate();
  const [editor, setEditor] = useState<INoteEditor | null>(null);
  const params = useParams<{ note_slug: string }>();
  const hasCalled = useRef(false);

  const [isSaveModalOpen, setSaveModal] = useState(false);

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
      secret: "",
      selfDestroyTime: "",
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
        secret: editor.secret,
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
              <fieldset>
                <div className="grid grid-cols-2">
                  <InputWithIcon
                    icon={<IoPencilOutline />}
                    placeholder="Enter note secret"
                    type="text"
                    value={editor.secret!}
                    onChange={(value) => handleUpdate({ secret: value })}
                  />
                  <InputWithIcon
                    icon={<IoPencilOutline />}
                    placeholder="Enter timer e.g 2 seconds "
                    type="text"
                    value={editor.selfDestroyTime!}
                    onChange={(value) =>
                      handleUpdate({ selfDestroyTime: value })
                    }
                  />
                </div>
              </fieldset>
              <fieldset className="flex gap-x-4 flex-wrap gap-y-2 justify-end ">
                <button
                  className={`primary_button ${
                    editor.willSelfDestroy ? "success_text" : "gray-300"
                  } `}
                  onClick={() =>
                    handleUpdate({ willSelfDestroy: !editor.willSelfDestroy })
                  }
                  type={"button"}
                >
                  Self destruct{" "}
                  {editor.willSelfDestroy ? (
                    <FaCheck />
                  ) : (
                    <MdRadioButtonUnchecked />
                  )}
                </button>

                <button
                  className={`primary_button ${
                    editor.hidden ? "success_text" : "gray-300"
                  } `}
                  onClick={() => handleUpdate({ hidden: !editor.hidden })}
                  type={"button"}
                >
                  Mark as hidden{" "}
                  {editor.hidden ? <FaCheck /> : <MdRadioButtonUnchecked />}
                </button>

                <Button
                  text="Publish"
                  onClick={() => {
                    handleNoteUpload(editor.id);
                  }}
                />
              </fieldset>
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
