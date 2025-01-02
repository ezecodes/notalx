import { FC, ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  encodeToBase62,
  fetchAllAlias,
  formatRelativeTime,
  navigateBackOrHome,
  searchAliasByName,
} from "./utils";
import { ImCancelCircle } from "react-icons/im";
import {
  _IAlias,
  IApiResponse,
  INote,
  IOtpExpiry,
  ISingleScheduledTask,
  ITask,
} from "../type";
import { Link, useNavigate } from "react-router-dom";
import { TfiTimer } from "react-icons/tfi";
import { BsArrowDown, BsPersonCheck, BsStars, BsUnlock } from "react-icons/bs";
import { VscLock } from "react-icons/vsc";
import {
  IoArrowBackOutline,
  IoCreateOutline,
  IoPersonAdd,
  IoShareOutline,
} from "react-icons/io5";
import { GlobalContext } from "./hook";
import {
  MdDeleteOutline,
  MdOutlineEditCalendar,
  MdOutlineRadioButtonChecked,
} from "react-icons/md";
import { IoBookmarkOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { IoShareSocialOutline } from "react-icons/io5";
import { SiWhatsapp } from "react-icons/si";
import { FaTelegram } from "react-icons/fa";
import { BiDotsVertical, BiLogoTelegram } from "react-icons/bi";
import { GoArrowRight } from "react-icons/go";
import { Oval } from "react-loader-spinner";
import { IoIosArrowDown, IoMdCheckmarkCircleOutline } from "react-icons/io";

export const NoteEditHistory = () => {};

interface HighlightWordsProps {
  text: string;
}
const HighlightWords: React.FC<HighlightWordsProps> = ({ text }) => {
  return (
    <p className="">
      {text.split(" ").map((word, index) => (
        <span
          key={index}
          className="ml-1 mb-1 px-1 py-1 rounded-md text-sm"
          style={{
            backgroundColor: "#424242",
            display: "inline-block",
          }}
        >
          {word}
        </span>
      ))}
    </p>
  );
};

export const KeyValuePair = ({
  header,
  value,
}: {
  value: string;
  header: string;
}) => {
  return (
    <span className="flex items-center gap-x-1">
      <span className="subtext">{header}: </span>
      <span>{value}</span>
    </span>
  );
};

export const DraftEmail = () => {
  return (
    <div className="note_history_item">
      <h6 className="  text-sm subtext">Draft Email</h6>

      <div>
        <KeyValuePair value="[team@company.com]" header="email" />
        <KeyValuePair header="Subject" value="Q4 Strategy Meeting  " />
        <KeyValuePair
          header="body"
          value="Dear Team, As
        discussed, our meeting on Friday will focus on Q4 strategy..."
        />
      </div>

      <div className="flex items-center gap-x-2 justify-end">
        <Button text="Send email" onClick={() => {}} />
        <Button text="Copy email" onClick={() => {}} />
      </div>
    </div>
  );
};

export const SummerisedResultPane = () => {
  return (
    <aside className="modal">
      <div className="w-full mx-5 add_border py-3 px-3 rounded-sm flex  items-center justify-center sm:w-[500px]">
        <div className="flex flex-col gap-y-3">
          <p>
            In pricing your sass, identify all your user types , then place a
            feature that incorporates their usage on the sass under a tiered
            pricing
          </p>
          <div className="flex items-center gap-x-2 justify-end">
            <Button text="Copy" onClick={() => {}} />
            <Button text="Insert into note" onClick={() => {}} />
            <Button text="Refine" onClick={() => {}} />
          </div>
        </div>
      </div>
    </aside>
  );
};

type ISuggestedActionParam = () => void;
type ISuggestedAction = {
  summerise: ISuggestedActionParam;
  schedule: ISuggestedActionParam;
  email: ISuggestedActionParam;
  prioritize: ISuggestedActionParam;
  todo: ISuggestedActionParam;
  highlightedText: string | null;
  loadingStates: {
    summary: boolean;
  };
  style?: any;
};
export const SuggestedActionButtons: FC<ISuggestedAction> = ({
  email,
  prioritize,
  schedule,
  summerise,
  todo,
  highlightedText,
  loadingStates,
  style,
}) => {
  return (
    <div
      style={style}
      className="flex flex-col items-start gap-y-2 animate__fadeInUp animate__animated"
    >
      <div className="flex items-center gap-x-2">
        <h3 className="  text-sm subtext">Sugested Actions</h3>
        <BsStars className="text-yellow-200 " />
      </div>

      <div className="flex items-center gap-x-3 swirl_parent ">
        <Button
          text="Summerise"
          icon={loadingStates.summary ? <RingsLoader /> : <></>}
          onClick={summerise}
          bg="bg-[#333]"
        />
        <Button text="Schedule tasks" onClick={schedule} />
        <Button text="Draft email" onClick={email} />
      </div>
    </div>
  );
};

export const CollaboratorsModal: FC<{
  note_id: string;
  note_owner_id: string;
  onClose: () => void;
}> = ({ note_id, onClose, note_owner_id }) => {
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
      className="modal top_space py-5"
      style={{ background: "#212121f7", backdropFilter: "blur(1px)" }}
    >
      <div className="top_space sm:w-[400px]">
        <BackButton text="Manage note collaborators" onClick={onClose} />
        <br />
        <SearchDropdown
          filter={(option) => option.id !== note_owner_id}
          selected={selected}
          onClick={handleCollabUpdate}
        />

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
          <span className="text-sm subtext">Exisiting collaborators</span>
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
            Close
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
  bg,
}: {
  text: string;
  onClick: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
  action?: Action;
  bg?: string;
}) => {
  return (
    <button
      className={`primary_button ${bg ?? ""} `}
      onClick={onClick}
      type={type ?? "button"}
    >
      {text} {icon && icon}
    </button>
  );
};

interface IBb {
  url?: any;
  text: string;
  onClick?: () => void;
}
export const BackButton: FC<IBb> = ({ text, url, onClick }) => {
  return (
    <div className="flex my-5 items-center gap-x-3">
      <IoArrowBackOutline onClick={() => onClick ?? navigateBackOrHome()} />

      <h3 className="text-[1rem] transform-capitalize subtext font-[500]">
        {text}
      </h3>
    </div>
  );
};

interface InputWithIconProps {
  type: string;
  placeholder: string;
  icon?: ReactNode;
  value: any;
  onChange: (value: string) => void;
  focusListener?: () => void;
  blurListener?: () => void;
  disabled?: boolean;
  label?: string;
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
  label,
}) => {
  return (
    <div className="label_input">
      {label && <label>{label}</label>}
      <div className="form_input">
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
    </div>
  );
};

interface SearchDropdownProps {
  onClick: (selected: _IAlias | null) => void;
  selected: _IAlias | null;
  filter?: (option: _IAlias) => boolean;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  onClick,
  selected,
  filter,
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

  const handleFilter = (option: _IAlias) => {
    if (filter) {
      return filter(option) && option.id !== otpExpiry?.alias_id;
    }
    return option.id !== otpExpiry?.alias_id;
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
          {options.filter(handleFilter).map((option) => (
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

type DropdownProps = {
  options: string[];
  label: string;
};

export const Dropdown: React.FC<DropdownProps> = ({ options, label }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <div className="label_input">
      {label && <label>{label}</label>}
      <select
        onChange={(e) => setSelectedOption(e.target.value)}
        name="choice"
        value={selectedOption ?? "Reminder"}
        className="bg-[#333] py-4 px-4 w-full rounded-md flex items-center justify-start"
      >
        <option value="">-Reminder-</option>;
        {options.map((option) => {
          return <option value={option}>{option}</option>;
        })}
      </select>
    </div>
  );
};

export const ScheduledTasksWrapper: FC<{ tasks: ITask[] }> = ({ tasks }) => {
  return (
    <div className="w-full flex flex-wrap gap-4 mt-4">
      {tasks.map((task) => {
        return (
          <div
            key={task.id}
            className="flex shadow-md bg-[#292929] flex-col gap-y-2 relative h-[170px] rounded-sm w-[300px]"
          >
            <MdOutlineEditCalendar
              className="absolute subtext right-[10px] top-[10px]"
              onClick={() => {
                window.location.href = `/task/${encodeToBase62(task.note_id)}`;
              }}
            />
            <h4 className=" subtext border_bottom py-2 font-[500] text-sm px-2">
              {task.task.name}
            </h4>
            <div className=" flex flex-col">
              <span className="flex items-center font-[500] text-center justify-center text-white gap-y-2 text-md">
                {new Date(task.task.date).toDateString()}
                <br />
                {new Date(task.task.date).toLocaleTimeString()}
              </span>
            </div>
            <div className="px-3 flex justify-center">
              {task.task.participants && (
                <AvatarGroup size="2" avatars={[{ name: "Jah" }]} />
              )}
            </div>

            <div className="flex justify-between px-2 py-1 border_top gap-x-3 w-full absolute bottom-0 left-0 items-center">
              <span className="text-sm subtext flex items-center gap-x-2 ">
                {new Date() < new Date(task.task.date) ? (
                  <>
                    <MdOutlineRadioButtonChecked className="text-sm text-yellow-300" />{" "}
                    Upcoming
                  </>
                ) : (
                  <>
                    <IoMdCheckmarkCircleOutline className="text-sm text-green-400" />{" "}
                    Ended
                  </>
                )}
              </span>
              <span className="text-sm subtext">
                {formatRelativeTime(task.task.date)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
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
      {formatRelativeTime(date)}
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
    </div>
  );
};

export const SharedHeader = () => {
  const navigate = useNavigate();
  const { otpExpiry } = useContext(GlobalContext)!;
  return (
    <header className="flex flex-col py-4 gap-y-5 w-full items-center top_space">
      <div className="flex flex-row gap-x-2 3micro:gap-x-5 flex-wrap sm:flex-nowrap gap-y-2 items-center justify-center">
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
      </div>
    </header>
  );
};

interface Avatar {
  src?: string; // Optional for cases without an image
  alt?: string;
  name?: string; // Optional name to display initials
}

interface AvatarGroupProps {
  avatars: Avatar[];
  size?: string; // Tailwind size classes like "10", "12", etc.
  spacing?: string; // Negative margin classes like "-2", "-3", etc.
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  size = "10",
  spacing = "-3",
}) => {
  return (
    <div className="flex items-center">
      {avatars.map((avatar, index) => (
        <div
          title={avatar.name}
          key={index}
          className={`relative inline-block rounded-full border-2 border-white bg-[#555555] flex items-center justify-center`}
          style={{
            marginLeft: index === 0 ? "0" : `-${spacing}rem`,
            width: `${size}rem`,
            height: `${size}rem`,
          }}
        >
          {avatar.src ? (
            <img
              src={avatar.src}
              alt={avatar.alt || "Avatar"}
              className={`w-full h-full rounded-full object-cover`}
            />
          ) : (
            <span
              className={`text-white text-sm font-bold`}
              style={{
                fontSize: `${parseInt(size) / 3}rem`, // Dynamically size initials text
              }}
            >
              {getInitials(avatar.name)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Helper function to extract initials from a name
const getInitials = (name?: string): string => {
  if (!name) return "?";
  const words = name.split(" ");
  return words.length > 1
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : words[0][0].toUpperCase();
};

export default AvatarGroup;

export const SingleNote: FC<{ note: INote; collaborators: _IAlias[] }> = ({
  note,
  collaborators,
}) => {
  return (
    <div
      className="shadow-sm w-full  pt-3 pb-1 h-[180px] 3micro:w-[350px] rounded-md gap-y-2 flex flex-col overflow-hidden"
      style={{ border: "1px solid #353535" }}
      key={note.id}
    >
      <div className="flex justify-between px-4">
        <span className="font-[500] text-md">{note.title}</span>
        {note.is_hidden && <VscLock className="text-[#a7a7a7]" />}
      </div>

      <Link
        to={"/" + encodeToBase62(note.id)}
        className="hover:bg-[#292929]   duration-300 cursor-pointer text-gray-300 h-[65%] overflow-hidden  px-4"
      >
        <span
          className="text-sm block h-full"
          dangerouslySetInnerHTML={{ __html: note.content }}
        ></span>
      </Link>

      <div className="flex  text-gray-400 cursor-pointer px-4 items-center justify-between gap-x-2">
        <AvatarGroup size="2" avatars={collaborators} />
        <div className="flex items-center gap-x-2">
          <DisplayDateCreated date={note.createdAt} />
          <IoBookmarkOutline />
          <NoteSharingPopup note={note} />
        </div>
      </div>
    </div>
  );
};
const NoteSharingPopup: FC<{ note: INote }> = ({ note }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const displayDropdown = () => {
    setDropdownVisible((prev) => !prev); // Toggle dropdown visibility
  };
  return (
    <div className="relative sharepopup">
      {isDropdownVisible && (
        <div className="popup_child animate__bounceIn animate__animated">
          <li
            className="dropdown_item"
            onClick={() => {
              navigator.clipboard
                .writeText("https://notalx.com/" + note.slug)
                .then(() => {
                  toast.success("Copied!");
                });
              displayDropdown();
            }}
          >
            <IoShareOutline /> Copy Link
          </li>
          <li
            className="dropdown_item"
            onClick={() => {
              window.open(
                `https://wa.me/?text=${encodeURIComponent(
                  "https://notalx.com/" + note.slug
                )}`,
                "_blank"
              );
              displayDropdown();
            }}
          >
            <SiWhatsapp className="text-[#25D366]" /> Share to WhatsApp
          </li>
          <li
            className="dropdown_item"
            onClick={() => {
              window.open(
                `https://t.me/share/url?url=${encodeURIComponent(
                  "https://notalx.com/" + note.slug
                )}`
              );
              displayDropdown();
            }}
          >
            <BiLogoTelegram className="text-[#0088cc]" /> Share to Telegram
          </li>{" "}
        </div>
      )}
      <IoShareSocialOutline onClick={displayDropdown} />
    </div>
  );
};

const TextSelectionPopup: FC<{ note: INote }> = ({ note }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const displayDropdown = () => {
    setDropdownVisible((prev) => !prev); // Toggle dropdown visibility
  };
  return (
    <div className="relative sharepopup">
      {isDropdownVisible && (
        <div className="popup_child animate__bounceIn animate__animated">
          <li
            className="dropdown_item"
            onClick={() => {
              navigator.clipboard
                .writeText("https://notalx.com/" + note.slug)
                .then(() => {
                  toast.success("Link copied to clipboard");
                });
              displayDropdown();
            }}
          >
            <IoShareOutline /> Copy Link
          </li>
          <li
            className="dropdown_item"
            onClick={() => {
              window.open(
                `https://wa.me/?text=${encodeURIComponent(
                  "https://notalx.com/" + note.slug
                )}`,
                "_blank"
              );
              displayDropdown();
            }}
          >
            <SiWhatsapp className="text-[#25D366]" /> Share to WhatsApp
          </li>
          <li
            className="dropdown_item"
            onClick={() => {
              window.open(
                `https://t.me/share/url?url=${encodeURIComponent(
                  "https://notalx.com/" + note.slug
                )}`
              );
              displayDropdown();
            }}
          >
            <BiLogoTelegram className="text-[#0088cc]" /> Share to Telegram
          </li>{" "}
        </div>
      )}
      <IoShareSocialOutline onClick={displayDropdown} />
    </div>
  );
};

const RingsLoader = () => (
  <Oval
    visible={true}
    height="20"
    width="20"
    strokeWidth={5}
    color="#ddd"
    ariaLabel="oval-loading"
    wrapperStyle={{}}
    wrapperClass=""
  />
);
