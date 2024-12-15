import "react-quill/dist/quill.snow.css";
import "choices.js/public/assets/styles/choices.min.css";

import React, { ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  IoCreateOutline,
  IoEyeOffOutline,
  IoPencilOutline,
  IoPerson,
} from "react-icons/io5";
import ReactQuill from "react-quill";
import { ImCancelCircle, ImInfo } from "react-icons/im";
import { FaRegEyeSlash } from "react-icons/fa";
import { IoEyeOutline } from "react-icons/io5";

interface Editor {
  hidden?: boolean;
  title?: string;
  content?: string;
}

const Page = () => {
  const [isEditorVisibile, setEditorVisibility] = useState(true);
  const [editor, setEditor] = useState<Editor>({
    content: "",
    hidden: false,
    title: "",
  });
  const [isSaveModalVisible, setSaveModalVisibility] = useState(true);

  // Handle content change
  const handleNoteChange = (data: Editor) => {
    setEditor((prev) => ({ ...prev, ...data }));
  };

  const handleNoteUpload = () => {
    // Handle the note submission or saving here (e.g., upload the note content to a server)
    console.log("Note content:", editor.content);
  };

  return (
    <section className="flex flex-col justify-center items-center w-full">
      <header className="flex flex-col py-4 gap-y-5 w-full items-center ">
        <div className="flex flex-row gap-x-5">
          <Button
            text="Create note"
            icon={<IoCreateOutline />}
            listener={() => setEditorVisibility(true)}
          />
          <form className="w-full flex justify-center">
            <div className="flex items-center gap-x-3">
              <InputWithIcon
                icon={<IoPerson />}
                placeholder="Find your alias"
                type="text"
              />
              {/* <Button text="Find" listener={() => setEditorVisibility(false)} /> */}
            </div>
          </form>
        </div>
      </header>

      {isSaveModalVisible && isEditorVisibile && (
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
            <ImCancelCircle onClick={() => setSaveModalVisibility(false)} />
          </div>

          <div className="flex flex-col gap-y-3">
            <div className="flex flex-col items-start  w-[300px]">
              <label className="text-gray-400">Find your alias</label>
              <SearchDropdown options={[]} />
            </div>

            {editor.hidden && (
              <div className="flex flex-col items-start w-[300px]">
                <label className="text-gray-400">
                  Enter a secret for this alias
                </label>
                <InputWithIcon
                  icon={<IoEyeOffOutline />}
                  placeholder="Enter a secret"
                  type="password"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {isEditorVisibile && (
        <form className="min-w-[300px] relative gap-y-3 flex flex-col shadow-md px-3 my-5 py-3">
          <h3 className="text-[1.3rem] font-[500]">Creating note</h3>

          <div className="absolute right-0">
            <Button
              text="Close"
              icon={<ImCancelCircle />}
              listener={() => setEditorVisibility(false)}
            />
          </div>

          <fieldset className="flex flex-col gap-y-3">
            <div>
              <InputWithIcon
                icon={<IoPencilOutline />}
                placeholder="Enter note title"
                type="text"
              />
            </div>
            <div>
              <NoteEditor
                value={editor.content ?? ""}
                onChange={(value) => handleNoteChange({ content: value })}
              />
            </div>
          </fieldset>
          <fieldset className="flex gap-x-4 justify-end ">
            <Button
              text={editor.hidden ? "Mark as public" : "Mark as hidden"}
              icon={editor.hidden ? <FaRegEyeSlash /> : <IoEyeOutline />}
              listener={() => handleNoteChange({ hidden: !editor.hidden })}
            />
            <Button
              text="Save note"
              listener={() => setSaveModalVisibility(true)}
            />
          </fieldset>
        </form>
      )}
    </section>
  );
};

const Button = ({
  listener,
  text,
  icon,
  type,
}: {
  text: string;
  listener: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
}) => {
  return (
    <button
      className="rounded-md gap-x-2 max-w-[180px] button px-3 py-2  flex items-center justify-center "
      onClick={listener}
      type={type ?? "button"}
    >
      {text} {icon && icon}
    </button>
  );
};

interface InputWithIconProps {
  type: string;
  placeholder: string;
  icon?: ReactNode; // This will be the icon passed as a prop
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
  type,
  placeholder,
  icon,
}) => {
  return (
    <div className="flex input items-center border border-gray-300 rounded-lg p-2 w-full max-w-xs">
      {icon && <span className="text-gray-500">{icon}</span>}
      <input
        type={type}
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
  options: string[];
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ options }) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Filter dropdown options based on input
    const filtered = options.filter((option) =>
      option.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered);
    setShowDropdown(true);
  };

  // Handle option selection
  const handleOptionClick = (option: string) => {
    setInputValue(option);
    setShowDropdown(false); // Hide dropdown after selection
  };

  // Close dropdown when clicking outside
  const handleBlur = () => {
    // Add a slight delay to allow click event to register before closing
    setTimeout(() => setShowDropdown(false), 100);
  };

  return (
    <div className="relative w-full ">
      <input
        type="text"
        name="alias"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)} // Show dropdown on focus
        onBlur={handleBlur}
        placeholder="Start typing..."
        className="w-full input bg-transparent border border-gray-300 rounded-md p-2  "
      />
      {showDropdown && filteredOptions.length > 0 && (
        <ul className="absolute w-full bg-[#232323] border border-gray-300 rounded-md mt-1 shadow-lg z-10">
          {filteredOptions.map((option) => (
            <li
              key={option}
              onClick={() => handleOptionClick(option)}
              className="px-4 py-2 cursor-pointer  "
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
createRoot(document.getElementById("root")!).render(<Page />);
