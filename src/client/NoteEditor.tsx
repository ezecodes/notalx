import { FC, useState } from "react";
import { Button, InputWithIcon, SearchDropdown } from "./component";
import { ImCancelCircle, ImInfo } from "react-icons/im";
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoPencilOutline,
} from "react-icons/io5";
import { IoIosTimer } from "react-icons/io";
import { FaRegEyeSlash } from "react-icons/fa";
import ReactQuill from "react-quill";
import { _Alias } from "../type";

interface IEditor {
  onClose: () => void;
  isOpen: boolean;
}
const Editor: FC<IEditor> = ({ onClose, isOpen }) => {
  const [editor, setEditor] = useState({
    title: "",
    content: "",
    hidden: false,
    selfDestruct: false,
    isSaving: false,
  });

  const handleNoteUpload = async ({
    alias_id,
    secret,
  }: {
    alias_id: string;
    secret?: string;
  }) => {
    const f = await fetch("/note", {
      method: "post",
      body: JSON.stringify({
        title: editor.title,
        content: editor.content,
        hidden: editor.hidden,
        self_destruct: editor.selfDestruct,
        alias_id,
        secret,
      }),
      headers: {
        "content-type": "application/json",
      },
    });
    const response = await f.json();
    alert(response.message);

    if (response.status === "ok") {
      onClose();
    }
  };

  if (!isOpen) return <></>;

  return (
    <>
      <div className="modal animate__animated animate__slideInDown">
        <form className="min-w-[300px] relative gap-y-3 flex flex-col shadow-md px-3 my-5 py-3">
          <h3 className="text-[1.3rem] font-[500]">Creating note</h3>

          <div className="absolute right-0">
            <Button text="Close" icon={<ImCancelCircle />} onClick={onClose} />
          </div>

          <fieldset className="flex flex-col gap-y-3">
            <div>
              <InputWithIcon
                icon={<IoPencilOutline />}
                placeholder="Enter note title"
                type="text"
                value={editor.title}
                onChange={(value) =>
                  setEditor((prev) => ({ ...prev, title: value }))
                }
              />
            </div>
            <div>
              <NoteEditor
                value={editor.content ?? ""}
                onChange={(value) =>
                  setEditor((prev) => ({ ...prev, content: value }))
                }
              />
            </div>
          </fieldset>
          <fieldset className="flex gap-x-4 justify-end ">
            <Button
              text="Self destruct"
              icon={<IoIosTimer />}
              onClick={() =>
                setEditor((prev) => ({
                  ...prev,
                  selfDestruct: !prev.selfDestruct,
                }))
              }
            />
            <Button
              text={editor.hidden ? "Mark as public" : "Mark as hidden"}
              icon={editor.hidden ? <FaRegEyeSlash /> : <IoEyeOutline />}
              onClick={() =>
                setEditor((prev) => ({ ...prev, hidden: !prev.hidden }))
              }
            />
            <Button
              text="Save note"
              onClick={() => setEditor((prev) => ({ ...prev, isSaving: true }))}
            />
          </fieldset>
        </form>
      </div>
      <SaveModal
        isOpen={editor.isSaving}
        handleNoteUpload={handleNoteUpload}
        isHidden={editor.hidden}
        onClose={() => setEditor((prev) => ({ ...prev, isSaving: false }))}
      />{" "}
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
}
const SaveModal: FC<ISaveModal> = ({
  onClose,
  handleNoteUpload,
  isOpen,
  isHidden,
}) => {
  const [info, setInfo] = useState({ secret: "" });
  const [selectedAlias, setSelectedAlias] = useState<_Alias | null>(null);

  if (!isOpen) return <></>;
  return (
    <div className="modal animate__animated animate__slideInDown">
      <div
        style={{ border: "1px solid #535353" }}
        className="flex mt-7 flex-col gap-y-3 relative min-w-[300px] shadow-md px-5 py-5 rounded-md"
      >
        <h3 className="text-[1.1rem] font-[500]">Saving your note</h3>
        <div className="flex items-start gap-x-3 ">
          <ImInfo />
          <p className="text-gray-300 text-[.8rem]">
            You must choose an alias or type a new one in order to save your
            note. <br></br> For a note to be marked as hidden, its alias must
            have a secret{" "}
          </p>
        </div>

        <div className="absolute right-[10px]">
          <ImCancelCircle onClick={onClose} />
        </div>

        <div className="flex flex-col gap-y-3">
          <div className="label_input">
            <label className="text-gray-400">Find your alias</label>
            <SearchDropdown
              onClick={(value) => setSelectedAlias(value)}
              selected={selectedAlias}
            />
          </div>

          {isHidden && (
            <div className="label_input">
              <label className="text-gray-400">
                Enter a secret for this alias
              </label>
              <InputWithIcon
                icon={<IoEyeOffOutline />}
                placeholder="Enter a secret"
                type="password"
                value={info.secret}
                onChange={(value) =>
                  setInfo((prev) => ({ ...prev, secret: value }))
                }
              />
            </div>
          )}
        </div>

        <Button
          text="Proceed"
          onClick={() =>
            handleNoteUpload({
              alias_id: selectedAlias ? selectedAlias?.id : "",
              secret: info.secret,
            })
          }
        />
      </div>
    </div>
  );
};
