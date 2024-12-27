import { FC, ReactNode, useContext, useEffect, useState } from "react";
import {
  encodeToBase62,
  fetchAllAlias,
  formatDate,
  formatRelativeTime,
  searchAliasByName,
} from "./utils";
import { ImCancelCircle } from "react-icons/im";
import { _IAlias, IApiResponse, INote, IOtpExpiry } from "../type";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { TfiTimer } from "react-icons/tfi";
import { BsPersonCheck, BsUnlock } from "react-icons/bs";
import { VscLock } from "react-icons/vsc";
import {
  IoArrowBackOutline,
  IoCreateOutline,
  IoPersonAdd,
} from "react-icons/io5";
import { CiCircleChevDown } from "react-icons/ci";
import { GlobalContext } from "./hook";
import { MdDeleteOutline } from "react-icons/md";
import { IoBookmarkOutline } from "react-icons/io5";
import { toast } from "react-toastify";

export const CollaboratorsModal: FC<{
  note_id: string;
  onClose: () => void;
}> = ({ note_id, onClose }) => {
  const [collaborators, setCollaborators] = useState<_IAlias[]>([]);
  const [newCollaborators, setNewCollaborators] = useState<_IAlias[]>([]);

  async function getNoteCollaborators(note_id: string) {
    const f = await fetch(`/api/note/${note_id}/collaborators`);
    const response: IApiResponse<{ rows: _IAlias[] }> = await f.json();

    response.status === "ok" && setCollaborators(response.data!.rows);
  }
  useEffect(() => {
    getNoteCollaborators(note_id);
  }, []);

  const [selected, setSelected] = useState<_IAlias | null>(null);

  function handleCollabUpdate(collab: _IAlias | null) {
    setSelected(collab);
    if (!collab) return;
    let items = newCollaborators;
    if (!items) {
      items = [collab];
      setNewCollaborators(items);
    } else {
      if (items.find((i) => i.id === collab.id)) return;
      items.push(collab);
      setNewCollaborators(items);
    }
  }

  function handleCollabDelete(alias_id: string) {
    if (selected?.id === alias_id) {
      setSelected(null);
    }
    setNewCollaborators((prev) =>
      prev.filter((alias) => alias.id !== alias_id)
    );
  }

  async function sendRemove(alias_id: string) {
    const f = await fetch(`/api/note/${note_id}/collaborators`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ note_id, alias_id }),
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      setCollaborators((prev) => prev.filter((alias) => alias.id !== alias_id));
      toast.success(response.message);
    }
  }

  async function save() {
    const f = await fetch(`/api/note/${note_id}/collaborators`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ collaborators: newCollaborators }),
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      toast.success(response.message);
    }
  }
  return (
    <div
      className="modal top_space my-5"
      style={{ background: "#212121f7", backdropFilter: "blur(1px)" }}
    >
      <div className="top_space sm:w-[400px]">
        <BackButton text="Adding note collaborators" url={-1} />
        <br />
        <SearchDropdown selected={selected} onClick={handleCollabUpdate} />

        <div className="flex flex-col gap-y-2 pt-2 ">
          {newCollaborators.length > 0 &&
            newCollaborators.map((i) => {
              return (
                <li className="dropdown_item relative">
                  {i.name}
                  <MdDeleteOutline
                    onClick={() => handleCollabDelete(i.id)}
                    className="delete_ico absolute right-[5px]"
                  />
                </li>
              );
            })}
        </div>
        <div className="flex flex-col gap-y-2 pt-2 border_top mt-2">
          {collaborators.length > 0 &&
            collaborators.map((i) => {
              return (
                <li className="dropdown_item relative">
                  {i.name}
                  <span
                    onClick={() => sendRemove(i.id)}
                    className="absolute right-[5px] hidden text-sm"
                  >
                    Remove
                  </span>
                </li>
              );
            })}
        </div>

        <div className="flex justify-end gap-x-3 mt-3">
          <button className="sub_button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary_button" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

type Action = "delete" | "edit" | "view";

export const Button = ({
  onClick,
  text,
  icon,
  type,
}: {
  text: string;
  onClick: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
  action?: Action;
}) => {
  return (
    <button
      className={`primary_button   `}
      onClick={onClick}
      type={type ?? "button"}
    >
      {text} {icon && icon}
    </button>
  );
};

interface IBb {
  url: any;
  text: string;
}
export const BackButton: FC<IBb> = ({ text, url }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col justify-start gap-y-3">
      <IoArrowBackOutline onClick={() => navigate(url)} />

      <h3 className="text-[1.1rem] font-[500]">{text}</h3>
    </div>
  );
};

interface InputWithIconProps {
  type: string;
  placeholder: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  focusListener?: () => void;
  blurListener?: () => void;
  disabled?: boolean;
}

export const InputWithIcon: FC<InputWithIconProps> = ({
  type,
  placeholder,
  icon,
  onChange,
  value,
  focusListener,
  blurListener,
  disabled,
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
        disabled={disabled}
        onBlur={blurListener}
        onFocus={focusListener}
        placeholder={placeholder}
        className="ml-2 w-full  bg-transparent placeholder-gray-400  "
      />
    </div>
  );
};

interface SearchDropdownProps {
  onClick: (selected: _IAlias | null) => void;
  selected: _IAlias | null;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  onClick,
  selected,
}) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [options, setOptions] = useState<_IAlias[]>([]);
  const [input, setInput] = useState<string>("");
  const { otpExpiry } = useContext(GlobalContext)!;

  useEffect(() => {
    fetchAllAlias().then((res) => {
      res.data && setOptions(res.data.rows);
    });
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    searchAliasByName(value).then((res) => {
      res.data && setOptions(res.data.rows);
    });
  };

  const handleOptionClick = (option: _IAlias) => {
    onClick(option);
    handleBlur();
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 300);
  };

  return (
    <div className="relative w-full  ">
      <div className="w-full p-2 input bg-transparent border border-gray-300 rounded-md  flex items-center">
        {selected && (
          <button className="bg-[#535ca3] px-2 w-[130px] h-[30px] gap-x-1 text-sm rounded-full flex items-center justify-center">
            <Link
              to={"/?alias=" + encodeToBase62(selected.id!)}
              style={{ textOverflow: "ellipsis", overflow: "hidden" }}
            >
              {selected.name}
            </Link>
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
        <ul
          style={{ borderTop: "1px solid #555555" }}
          className="absolute w-full bg-[#232323] border border-gray-300 rounded-md mt-1 shadow-lg z-10"
        >
          {options
            .filter((i) => i.id !== otpExpiry?.alias_id)
            .map((option) => (
              <li
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className="px-4 py-3 cursor-pointer hover:bg-gray-[#777777] "
                style={{ borderBottom: "1px solid #555555" }}
              >
                {option.name}
              </li>
            ))}
          <Link to={"/newalias"} className="text-sm px-4 flex justify-center">
            New Alias
          </Link>
        </ul>
      )}
    </div>
  );
};

interface IExInfo {
  willSelfDestroy: boolean;
  time: Date;
}

export const ExpirationInfo: FC<IExInfo> = ({ willSelfDestroy, time }) => {
  if (willSelfDestroy) {
    return (
      <button
        className={`text-sm flex items-center gap-x-2 text-gray-300`}
        type={"button"}
        disabled
      >
        {new Date(time).toLocaleString("en-US", {
          year: "numeric",
          month: "short", // Abbreviated month, e.g., "Dec"
          day: "numeric", // Day of the month, e.g., "27"
          hour: "2-digit", // Hour, e.g., "3"
          minute: "2-digit", // Minutes, e.g., "45"
          hour12: true, // Use 12-hour clock
        })}
        <TfiTimer />
      </button>
    );
  }
  return (
    <button
      className={`text-sm flex items-center gap-x-2 text-gray-300`}
      type={"button"}
      disabled
    >
      No expiration
      <TfiTimer />
    </button>
  );
};

interface IHi {
  hidden: boolean;
}
export const IsHiddenInfo: FC<IHi> = ({ hidden }) => {
  if (hidden) {
    return (
      <button
        className={`text-sm flex items-center gap-x-2 text-gray-300`}
        type={"button"}
        disabled
      >
        Hidden
        <VscLock />
      </button>
    );
  }
  return (
    <button
      className={`text-sm flex items-center gap-x-2 text-gray-300`}
      type={"button"}
      disabled
    >
      Public
      <BsUnlock />
    </button>
  );
};

interface IDc {
  date: string | Date;
}
export const DisplayDateCreated: FC<IDc> = ({ date }) => {
  return (
    <span className="text-sm subtext flex items-center">
      {new Date(date).toLocaleDateString()}
    </span>
  );
};

interface IAuthorisedInfo {
  onClick?: () => void;
  clickUrl: any;
  otpExpiry: IOtpExpiry | null;
}

export const AuthorisedInfo = ({ otpExpiry, clickUrl }: any) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();

  const displayDropdown = () => {
    setDropdownVisible((prev) => !prev); // Toggle dropdown visibility
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <div
        className="flex cursor-pointer px-2 py-2 rounded-sm items-center gap-x-2 hover:bg-[rgba(0,0,0,.1)] duration-300"
        onClick={() => navigate(clickUrl as any)}
      >
        <BsPersonCheck
          className={`${
            otpExpiry?.is_valid_auth ? "text-green-400" : "text-white"
          } text-[25px]`}
        />
        <span className="subtext hidden 3micro:inline text-sm">
          {otpExpiry?.name}
        </span>

        {otpExpiry?.is_valid_auth && (
          <CiCircleChevDown
            className="cursor-pointer text-[20px]"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the parent click
              displayDropdown();
            }}
          />
        )}
      </div>

      {/* Dropdown Menu */}
      {isDropdownVisible && (
        <div className="absolute mt-2 right-0 w-48 bg-[#2c2c2c] border border-gray-200 shadow-lg rounded-md">
          <ul>
            <li
              className="px-4 py-2 hover:bg-[#3f3f3f] cursor-pointer"
              onClick={() => navigate("/notes")}
            >
              My Notes
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export const SharedHeader = () => {
  const navigate = useNavigate();
  const { selectedAlias, setSelectedAlias, otpExpiry } =
    useContext(GlobalContext)!;
  return (
    <header className="flex flex-col py-4 gap-y-5 w-full items-center top_space">
      <div className="flex flex-row gap-x-5 flex-wrap sm:flex-nowrap gap-y-2 items-center justify-center">
        <Button
          text="New alias"
          icon={<IoPersonAdd />}
          onClick={() => navigate("/newalias")}
        />
        <Button
          text="Create note"
          icon={<IoCreateOutline />}
          onClick={() => {
            navigate("/newnote");
          }}
        />
        <AuthorisedInfo clickUrl="/auth-with-alias" otpExpiry={otpExpiry} />

        <div className="flex w-full items-center gap-x-3">
          <SearchDropdown
            onClick={(value) => setSelectedAlias(value)}
            selected={selectedAlias}
          />
        </div>
      </div>
    </header>
  );
};

export const SingleNote: FC<{ note: INote }> = ({ note }) => {
  const { Is_Authorised_Alias_Same_As_Note_Alias, deleteNote } =
    useContext(GlobalContext)!;
  const navigate = useNavigate();

  return (
    <div
      className="shadow-sm w-full  py-2 h-[170px] 3micro:w-[450px] rounded-md gap-y-2 flex flex-col overflow-hidden"
      style={{ border: "1px solid #353535" }}
      key={note.id}
    >
      <div className="flex justify-between px-4">
        <span className="font-[500] text-md">{note.title}</span>
        {note.is_hidden && <VscLock className="text-[#a7a7a7]" />}
      </div>

      <Link
        to={"/" + note.slug}
        className="hover:bg-[#292929] duration-300 cursor-pointer text-gray-300 h-[65%] overflow-hidden  px-4"
      >
        <span
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: note.content }}
        ></span>
      </Link>

      <div className="flex  text-gray-400 cursor-pointer px-4 items-center justify-end gap-x-2">
        <DisplayDateCreated date={note.createdAt} />
        {Is_Authorised_Alias_Same_As_Note_Alias(note.alias_id) ? (
          <>
            <MdDeleteOutline
              onClick={() => deleteNote(note.id)}
              className="delete_ico"
            />
            <IoCreateOutline
              onClick={() => navigate("/edit/" + note.slug)}
              className="edit_ico"
            />
          </>
        ) : (
          <></>
        )}
        <IoBookmarkOutline />
      </div>
    </div>
  );
};
