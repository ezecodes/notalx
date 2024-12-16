import "react-quill/dist/quill.snow.css";
import "choices.js/public/assets/styles/choices.min.css";
import "react-toastify/dist/ReactToastify.css";

import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  IoCreateOutline,
  IoEyeOffOutline,
  IoMailOutline,
  IoPencilOutline,
  IoPerson,
  IoPersonAdd,
  IoPersonOutline,
} from "react-icons/io5";
import ReactQuill from "react-quill";
import { ImCancelCircle, ImInfo } from "react-icons/im";
import { FaRegEyeSlash } from "react-icons/fa";
import { IoEyeOutline } from "react-icons/io5";
import { IoIosTimer } from "react-icons/io";
import { Alias, ICreateNote, Note } from "../type";
import { Optional } from "sequelize";

interface Editor {
  hidden?: boolean;
  title?: string;
  content?: string;
  selectedAliasId?: string;
}

const Page = () => {
  const [isEditorVisibile, setEditorVisibility] = useState(false);

  const [isCreateAliasModalVisible, setCreateAliasModalVisibility] =
    useState(false);

  const [selectedAlias, setSelectedAlias] = useState<_Alias | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<{
    id: string;
    rows: Note[];
  } | null>(null);

  useEffect(() => {
    if (!selectedAlias) return;
    fetchAliasNotes(selectedAlias?.id).then((res) => {
      console.log(res);
      setSelectedNotes({ id: "", rows: res.data.rows });
    });
  }, [selectedAlias?.id]);

  return (
    <section className="flex flex-col justify-center items-center w-full">
      <header className="flex flex-col py-4 gap-y-5 w-full items-center ">
        <div className="flex flex-row gap-x-5">
          <Button
            text="New alias"
            icon={<IoPersonAdd />}
            onClick={() => setCreateAliasModalVisibility(true)}
          />
          <Button
            text="Create note"
            icon={<IoCreateOutline />}
            onClick={() => setEditorVisibility(true)}
          />
          <form className="w-full flex justify-center">
            <div className="flex items-center gap-x-3">
              <SearchDropdown
                onClick={(value) => setSelectedAlias(value)}
                selected={selectedAlias}
              />
            </div>
          </form>
        </div>
      </header>

      <CreateAlias
        isOpen={isCreateAliasModalVisible}
        onClose={() => setCreateAliasModalVisibility(false)}
      />

      {isEditorVisibile && (
        <Editor
          isOpen={isEditorVisibile}
          onClose={() => setEditorVisibility(false)}
        />
      )}

      {selectedAlias && selectedNotes && selectedNotes?.rows.length > 0 && (
        <section className="w-full px-10 py-5 mb-3">
          {/* <h3>Browsing notes: {selectedAlias?.name}</h3> */}
          <div className="flex gap-4">
            {selectedNotes?.rows.map((i, key) => {
              return (
                <div
                  className="shadow-md py-2 h-[200px] 2micro:w-[400px] rounded-md gap-y-2 flex flex-col overflow-hidden"
                  style={{ border: "1px solid #555555" }}
                >
                  <div className="flex justify-between px-4">
                    <span className="font-[500] text-[1.1rem]">{i.title}</span>
                  </div>
                  <div
                    className="hover:bg-[#292929] duration-300 cursor-pointer text-gray-300 h-[65%] overflow-hidden  px-4"
                    onClick={() => setSelectedNote(i)}
                  >
                    <span
                      dangerouslySetInnerHTML={{ __html: i.content }}
                    ></span>
                  </div>

                  <div className="flex  px-4 items-center justify-end gap-x-5">
                    <span className="text-gray-400 text-sm">
                      {formatRelativeTime(i.createdAt)}{" "}
                    </span>
                    <IoCreateOutline />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <ViewNote selected={selectedNote} onClose={() => setSelectedNote(null)} />
    </section>
  );
};

const Button = ({
  onClick,
  text,
  icon,
  type,
}: {
  text: string;
  onClick: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
}) => {
  return (
    <button
      className="rounded-md gap-x-2 max-w-[180px] button px-3 py-2  flex items-center justify-center "
      onClick={onClick}
      type={type ?? "button"}
    >
      {text} {icon && icon}
    </button>
  );
};

interface InputWithIconProps {
  type: string;
  placeholder: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
}

const InputWithIcon: FC<InputWithIconProps> = ({
  type,
  placeholder,
  icon,
  onChange,
  value,
}) => {
  return (
    <div className="flex input items-center border border-gray-300 rounded-lg p-2 w-full max-w-xs">
      {icon && <span className="text-gray-500">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="ml-2 w-full  bg-transparent   placeholder-gray-400  "
      />
    </div>
  );
};

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
interface SearchDropdownProps {
  onClick: (selected: _Alias | null) => void;
  selected: _Alias | null;
}
interface _Alias extends Optional<Alias, "email" | "secret"> {}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  onClick,
  selected,
}) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [options, setOptions] = useState<Alias[]>([]);
  const [input, setInput] = useState<string>("");

  useEffect(() => {
    fetchAlias().then((res) => {
      setOptions(res.data.rows);
    });
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    searchAliasByName(value).then((res) => {
      setOptions(res.data.rows);
    });
  };

  const handleOptionClick = (option: _Alias) => {
    onClick(option);
    handleBlur();
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 300);
  };

  return (
    <div className="relative  w-[300px] ">
      <div className="w-full px-2 input bg-transparent border border-gray-300 rounded-md  flex items-center">
        {selected && (
          <button className="bg-[#535ca3] px-3 w-[130px] h-[30px] gap-x-1 text-sm rounded-full flex items-center justify-center">
            <span style={{ textOverflow: "ellipsis", overflow: "hidden" }}>
              {selected.name}
            </span>
            <ImCancelCircle
              className="text-sm"
              onClick={() => {
                onClick(null);
              }}
            />
          </button>
        )}
        <input
          type="text"
          name="alias"
          value={input}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)} // Show dropdown on focus
          onBlur={handleBlur}
          placeholder="Find alias..."
          className="w-full bg-transparent p-2"
          autoComplete="off" // Disable browser's autocomplete
        />
      </div>

      {showDropdown && options.length > 0 && (
        <ul className="absolute w-full bg-[#232323] border border-gray-300 rounded-md mt-1 shadow-lg z-10">
          {options.map((option) => (
            <li
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-[#777777] "
              style={{ borderBottom: "1px solid #555555" }}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface ICreateAlias {
  onClose: () => void;
  isOpen: boolean;
}

const CreateAlias: FC<ICreateAlias> = ({ onClose, isOpen }) => {
  const [alias, setAlias] = useState({ name: "", secret: "", email: "" });

  const send = async () => {
    const f = await fetch("/alias", {
      method: "post",
      body: JSON.stringify(alias),
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
    <div className="modal animate__animated animate__slideInDown">
      <div
        style={{ border: "1px solid #535353" }}
        className="flex mt-7 flex-col gap-y-3 relative 3micro:w-[400px] sm:w-[600px] shadow-md px-5 py-5 rounded-md"
      >
        <h3 className="text-[1.1rem] font-[500]">Create an alias</h3>
        <div className="flex items-start gap-x-3 ">
          <ImInfo />
          <p className="text-gray-300 text-[.8rem]">
            Add a secret to this alias to enable you create hidden notes that
            can only be accessed with anyone with the secret. An email address
            though optional is recommended to enable you recover your secret
            incase you loose it
          </p>
        </div>

        <div className="absolute right-[10px]">
          <ImCancelCircle onClick={onClose} />
        </div>

        <div className="flex flex-col gap-y-3">
          <div className="label_input">
            <label>Choose your alias</label>
            <InputWithIcon
              placeholder="Chose an alias"
              type="text"
              value={alias.name}
              onChange={(value) =>
                setAlias((prev) => ({ ...prev, name: value }))
              }
            />
          </div>

          <div className="label_input">
            <label>Enter a secret for this alias (Optional)</label>
            <InputWithIcon
              icon={<IoEyeOffOutline />}
              placeholder="Enter a secret"
              type="password"
              value={alias.secret}
              onChange={(value) =>
                setAlias((prev) => ({ ...prev, secret: value }))
              }
            />
          </div>
          <div className="label_input">
            <label>Enter an email (Optional)</label>
            <InputWithIcon
              icon={<IoMailOutline />}
              placeholder=""
              type="email"
              value={alias.email}
              onChange={(value) =>
                setAlias((prev) => ({ ...prev, email: value }))
              }
            />
          </div>
        </div>

        <Button text="Create" onClick={send} />
      </div>
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

interface IViewNote {
  selected: Note | null;
  onClose: () => void;
}
const ViewNote: FC<IViewNote> = ({ selected, onClose }) => {
  if (!selected) return <></>;
  return (
    <div className="modal px-5 relative animate__animated animate__slideInDown">
      <div
        className="flex mt-7 flex-col gap-y-3 sm:w-[600px] md:w-[700px]  relative  shadow-md px-5 py-5 rounded-md"
        style={{
          border: "1px solid #555555",
        }}
      >
        <div className="absolute right-[10px]">
          <ImCancelCircle onClick={onClose} />
        </div>
        <h4 className="font-[500] text-[1.1rem]">{selected.title}</h4>
        <div dangerouslySetInnerHTML={{ __html: selected.content }}></div>
      </div>
    </div>
  );
};

const fetchAlias = async () => {
  const f = await fetch("/alias");
  return await f.json();
};

const fetchAliasNotes = async (id: string) => {
  const f = await fetch("/note/alias/" + id);
  return await f.json();
};
const searchAliasByName = async (name: string) => {
  const f = await fetch("/alias/search?name=" + name);
  return await f.json();
};

function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const timeUnits: { unit: string; seconds: number }[] = [
    { unit: "year", seconds: 365 * 24 * 60 * 60 },
    { unit: "month", seconds: 30 * 24 * 60 * 60 },
    { unit: "day", seconds: 24 * 60 * 60 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];

  for (const { unit, seconds } of timeUnits) {
    const value = Math.floor(diffInSeconds / seconds);
    if (value > 0) {
      return value === 1 ? `A ${unit} ago` : `${value} ${unit}s ago`;
    }
  }

  return "just now";
}
createRoot(document.getElementById("root")!).render(<Page />);
