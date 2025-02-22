import { FC, ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  encodeToBase62,
  fetchAllUser,
  formatRelativeTime,
  navigateBackOrHome,
  searchUserByName,
} from "./utils";
import { ImCancelCircle } from "react-icons/im";
import {
  IUserPublic,
  IApiResponse,
  ICollaborator,
  ICollaboratorPermission,
  IApiCollaborator,
  INote,
  INotification,
  IOtpExpiry,
  IPaginatedResponse,
  ITask,
  IUser,
  NotificationType,
} from "../type";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { TfiTimer } from "react-icons/tfi";
import { BsPersonCheck, BsStars, BsUnlock } from "react-icons/bs";
import { VscLock, VscNotebookTemplate } from "react-icons/vsc";
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
import { BiLogoTelegram } from "react-icons/bi";
import { GoArrowRight } from "react-icons/go";
import { RotatingLines, Puff } from "react-loader-spinner";
import {
  IoIosArrowDown,
  IoMdCheckmarkCircleOutline,
  IoMdNotificationsOutline,
} from "react-icons/io";
import { FiMoreVertical } from "react-icons/fi";
import { CiCircleMore } from "react-icons/ci";
import { PiTargetLight } from "react-icons/pi";

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
  loadingStates: {
    summary: boolean;
    task: boolean;
  };
  style?: any;
};
export const SuggestedActionButtons: FC<ISuggestedAction> = ({
  schedule,
  summerise,
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

      <div className="flex items-center flex-wrap gap-y-2 gap-x-3 swirl_parent ">
        <Button
          disabled={loadingStates.summary}
          text="Summerise"
          icon={loadingStates.summary ? <RingsLoader /> : <></>}
          onClick={summerise}
          bg="bg-[#333]"
        />
        <Button
          disabled={loadingStates.task}
          text="Schedule tasks"
          icon={loadingStates.task ? <RingsLoader /> : <></>}
          onClick={schedule}
        />
      </div>
    </div>
  );
};

export const CollaboratorsModal: FC<{
  note_id: string;
  note_owner_id: string;
  onClose: () => void;
  collaborators: IApiCollaborator[];
  saveCollaborator: (
    user_id: string,
    permission: ICollaboratorPermission
  ) => void;
  deleteCollaborator: (user_id: string) => void;
}> = ({
  note_id,
  onClose,
  note_owner_id,
  collaborators,
  deleteCollaborator,
  saveCollaborator,
}) => {
  const [selected, setSelected] = useState<Omit<IUser, "email"> | null>(null);

  const handleCollabUpdate = () => {};

  return (
    <div
      className="modal top_space py-5"
      style={{ background: "#212121f7", backdropFilter: "blur(1px)" }}
    >
      <div className="top_space sm:w-[450px] 3micro:w-[90%] w-full">
        <BackButton text="Manage note collaborators" onClick={onClose} />
        <br />
        {/* <SearchDropdown
          label="Add Collaborators"
          filter={(option) => option.id !== note_owner_id}
          selected={selected}
          onClick={handleCollabUpdate}
        /> */}
        <div className="flex flex-col gap-y-2 pt-2 border_top mt-2">
          <span className="text-sm subtext">Exisiting collaborators</span>
          {collaborators.length > 0 ? (
            collaborators.map((i) => {
              return (
                <li className="dropdown_item relative">
                  {i["user.name"]} {i.id === note_owner_id ? " (You)" : ""}
                  <span
                    onClick={() => deleteCollaborator(i.id)}
                    className="absolute right-[5px] hidden text-sm"
                  >
                    Remove
                  </span>
                </li>
              );
            })
          ) : (
            <span className="flex items-center justify-center px-4 py-3">
              You haven't added a collaborator
            </span>
          )}
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
  disabled,
}: {
  text: string;
  onClick: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
  action?: Action;
  bg?: string;
  disabled?: boolean;
}) => {
  return (
    <button
      disabled={disabled}
      className={`primary_button ${bg ?? ""} `}
      onClick={onClick}
      type={type ?? "button"}
    >
      {icon && icon} {text}
    </button>
  );
};

interface IBb {
  url?: any;
  text?: string;
  onClick?: () => void;
}
export const BackButton: FC<IBb> = ({ text, url, onClick }) => {
  return (
    <div className="flex my-5 items-center gap-x-3">
      <IoArrowBackOutline
        title="Go back"
        onClick={() => (onClick ? onClick() : navigateBackOrHome())}
      />

      <h3 className="text-[1rem] transform-capitalize subtext font-[500]">
        {text ?? "Back"}
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
  name?: string;
  endIcon?: ReactNode;
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
  name,
  endIcon,
}) => {
  return (
    <div className="label_input">
      {label && <label>{label}</label>}
      <div className="form_input">
        {icon && <span className="text-gray-500">{icon}</span>}
        <input
          type={type}
          value={value}
          name={name ?? label}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          disabled={disabled}
          onBlur={blurListener}
          onFocus={focusListener}
          placeholder={placeholder}
          className="ml-2 w-full  bg-transparent placeholder-gray-400  "
        />
        {endIcon && endIcon}
      </div>
    </div>
  );
};

interface SearchDropdownProps {
  onClick: (selected: IUserPublic | null) => void;
  selected: IUserPublic | null;
  filter?: (option: IUserPublic) => boolean;
  placeholder?: string;
  label?: string;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  onClick,
  selected,
  filter,
  placeholder,
  label,
}) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [options, setOptions] = useState<IUserPublic[]>([]);
  const [input, setInput] = useState<string>("");
  const { otpExpiry } = useContext(GlobalContext)!;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOptions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchUserByName(input);
        console.log(res);
        res.status === "ok" && setOptions(res.data!.rows);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId); // Cleanup previous timeout on new input
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleOptionClick = (option: IUserPublic) => {
    onClick(option);
    handleBlur();
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 180);
  };

  const handleFilter = (option: IUserPublic) => {
    if (filter) {
      return filter(option) && option.id !== otpExpiry?.user_id;
    }
    return option.id !== otpExpiry?.user_id;
  };

  return (
    <div className="relative w-full  ">
      {label && <span className="font-[500] block mb-2 ">{label}</span>}
      <div className="w-full p-2 input bg-transparent border border-gray-300 rounded-md  flex items-center">
        {selected && (
          <button
            title={selected.name}
            className="bg-[#535ca3] px-2 w-[130px] h-[30px] gap-x-1 text-sm rounded-full flex items-center justify-center"
          >
            <span
              className="text-sm"
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {selected.name}
            </span>
            <ImCancelCircle
              className="text-md"
              onClick={() => {
                onClick(null);
              }}
            />
          </button>
        )}
        <div>
          <input
            type="text"
            name="user"
            value={input}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)} // Show dropdown on focus
            onBlur={handleBlur}
            placeholder={placeholder ?? "Find users by name..."}
            className="w-full bg-transparent p-2"
            autoComplete="off" // Disable browser's autocomplete
          />
          {loading && <RingsLoader />}
        </div>
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
              className="px-4 py-3 cursor-pointer duration-100 hover:bg-gray-[#777777] "
              style={{ borderBottom: "1px solid #555555" }}
            >
              {option.name}
            </li>
          ))}
          <Link to={"/account"} className="text-sm px-4 flex justify-center">
            New Account
          </Link>
        </ul>
      )}
    </div>
  );
};

interface IExpirationInfo {
  time?: Date;
}

export const ExpirationInfo: FC<IExpirationInfo> = ({ time }) => {
  if (time) {
    return (
      <button
        className={`text-sm flex items-center gap-x-2 text-gray-300`}
        type={"button"}
        disabled
      >
        {new Date(time!).toLocaleString("en-US", {
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

const TaskOptionsPopup: FC<{ deleteTask: () => void; manage: () => void }> = ({
  deleteTask,
  manage,
}) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const displayDropdown = () => {
    setDropdownVisible((prev) => !prev); // Toggle dropdown visibility
  };
  return (
    <div className="relative ">
      <FiMoreVertical onClick={displayDropdown} />
      {isDropdownVisible && (
        <div
          className={`popup_child z-[1000] animate__animated ${
            isDropdownVisible
              ? "animate__zoomIn visible opacity-1"
              : "animate__zoomOut invisible opacity-0"
          }`}
        >
          <li className="dropdown_item" onClick={manage}>
            Manage Task
          </li>
          <li className="dropdown_item" onClick={deleteTask}>
            Delete Task
          </li>
        </div>
      )}
    </div>
  );
};

const determine_row_visibility = (row: ITask, sort: string | null) => {
  if (sort === "none") {
    return "block";
  }
  if (sort === "upcoming") {
    if (new Date(row.date) > new Date()) {
      return "block";
    } else {
      return "hidden";
    }
  }
  if (sort === "ended") {
    if (new Date(row.date) < new Date()) {
      return "block";
    } else {
      return "hidden";
    }
  }
};

export const ScheduledTasksWrapper: FC<{
  rows: { task: ITask; participants: IUserPublic[] }[];
}> = ({ rows }) => {
  const navigate = useNavigate();
  const [sort, setSort] = useState<"upcoming" | "ended" | "none">("none");

  if (!rows || rows.length === 0) {
    return (
      <div>
        <span>No tasks yet</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-x-8 gap-y-3 mt-2">
      <div className="w-full flex items-center gap-x-3">
        <h6 className="text-sm subtext">Sort by</h6>
        <select
          className="bg-[#333] text-sm "
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="none"> -- </option>
          <option value="upcoming"> Upcoming </option>
          <option value="ended"> Ended </option>
        </select>
      </div>
      <div className="grid_wrap">
        {rows.map((row) => {
          return (
            <div
              key={row.task.id}
              className={`flex shadow-md bg-[#292929] flex-col gap-y-2 relative h-[180px] rounded-sm w-full 3micro:w-[300px] ${determine_row_visibility(
                row.task,
                sort
              )}`}
            >
              <div className="  flex justify-between items-center border_bottom py-2   px-2">
                <span
                  className="text-sm subtext"
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.task.name}
                </span>
              </div>

              <div className=" flex flex-col gap-y-2  ">
                <span className="flex items-center  text-center justify-center text-white gap-y-2 text-md">
                  {new Date(row.task.date).toISOString().split("T")[0]}{" "}
                  {/* ISO Date (UTC) */}
                  {new Date(row.task.date)
                    .toISOString()
                    .split("T")[1]
                    .slice(0, 5)}{" "}
                  {/* ISO Time (UTC) */}
                </span>
                <div className="px-3 flex justify-center">
                  {row.participants && (
                    <AvatarGroup size="2" avatars={row.participants} />
                  )}
                </div>
              </div>

              <div className="flex h-[35px] justify-between px-2 py-1 border_top gap-x-3 w-full absolute bottom-0 left-0 items-center">
                <span className="text-sm subtext flex items-center gap-x-2 ">
                  {new Date().toISOString() <
                  new Date(row.task.date).toISOString() ? (
                    <>
                      <MdOutlineRadioButtonChecked className="text-sm text-yellow-300" />
                      Upcoming
                    </>
                  ) : (
                    <>
                      <IoMdCheckmarkCircleOutline className="text-sm text-green-400" />
                      Ended
                    </>
                  )}
                  <span className="text-sm subtext">
                    {formatRelativeTime(row.task.date)}
                  </span>
                </span>
                <span className="flex items-center gap-x-4">
                  <TaskSharingPopup task={row.task} />
                  <TaskOptionsPopup
                    deleteTask={() => {}}
                    manage={() =>
                      navigate(`/task/${encodeToBase62(row.task.id)}`)
                    }
                  />
                </span>
              </div>
            </div>
          );
        })}
      </div>
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

export const AuthorisedInfo = ({
  otpExpiry,
  clickUrl,
}: {
  otpExpiry: IOtpExpiry | null;
  clickUrl: any;
}) => {
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
        {otpExpiry?.is_valid_auth ? otpExpiry?.name : "Login"}
      </span>
    </div>
  );
};

export const Notifications: FC<{ notifications: INotification[] }> = ({
  notifications,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{ overflowY: "scroll" }}
      className="flex flex-col gap-y-4 shadow-md animate__fadeIn animate__animated absolute z-[88888] max-h-[100vh]  right-[-90px] md:left-[-75px] md:right-[auto] top-[50px] bg-[#333] w-[320px] 2micro:w-[350px] 3mirco:w-[430px]  rounded-md"
    >
      {notifications.map((notification) => {
        return (
          <div className="flex  border_bottom py-3 rounded-sm gap-y-3 px-5 flex-col">
            <div className=" flex flex-col gap-y-1  ">
              <h6 className="font-[500] text-md ">
                {notification.title}{" "}
                <span className="text-sm text-[#bbb] font-[300]">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </h6>
              <span
                className="text-sm subtetx"
                dangerouslySetInnerHTML={{ __html: notification.message }}
              />
            </div>
            <div className="flex justify-end">
              {notification.type === NotificationType.AddedCollaborator && (
                <Button
                  text="View Note"
                  onClick={() =>
                    navigate(
                      `/${encodeToBase62(notification.metadata.note_id)}`
                    )
                  }
                />
              )}{" "}
              {notification.type === NotificationType.AddedParticipant && (
                <Button
                  text="View Task"
                  onClick={() =>
                    navigate(
                      `/task/${encodeToBase62(notification.metadata.task_id)}`
                    )
                  }
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export const SharedHeader = () => {
  const navigate = useNavigate();
  const {
    otpExpiry,
    notifications,
    showNotificationModal,
    setNotificationModal,
  } = useContext(GlobalContext)!;
  const [loader, setLoader] = useState(false);

  const createNote = async () => {
    try {
      setLoader(true);
      const f = await fetch("/api/note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const response: IApiResponse<INote> = await f.json();
      if (response.status === "ok") {
        document.location.href = "/note/" + encodeToBase62(response.data!.id);
      }
    } finally {
      setLoader(false);
    }
  };
  return (
    <header className="flex flex-col py-4 mb-5 gap-y-5 w-full items-center relative top_space">
      <div className="flex flex-row gap-x-7  flex-wrap sm:flex-nowrap gap-y-2 items-end justify-center">
        {otpExpiry?.is_valid_auth ? (
          <>
            <Button
              text="Create note"
              disabled={loader ? true : false}
              icon={loader ? <RingsLoader /> : <IoCreateOutline />}
              onClick={createNote}
            />
          </>
        ) : (
          <>
            <Button
              text="Create Account"
              icon={<IoPersonAdd />}
              onClick={() => navigate("/account")}
            />
          </>
        )}
        <AuthorisedInfo clickUrl="/login" otpExpiry={otpExpiry} />
        {otpExpiry?.is_valid_auth && notifications.length > 0 && (
          <div className="relative h-[35px]">
            <button
              className="relative"
              onClick={() => setNotificationModal((prev) => !prev)}
            >
              <IoMdNotificationsOutline className="text-[1.5rem] subtext z-[4]" />
              <span className="noti">
                {notifications.filter((i) => !i.is_read).length}
              </span>
            </button>

            {showNotificationModal && (
              <Notifications notifications={notifications} />
            )}
          </div>
        )}
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
  const words = name.trim().split(" ");
  return words.length > 1
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : words[0][0].toUpperCase();
};

export default AvatarGroup;

export const SingleNote: FC<{
  type: "template" | "note";
  note: INote;
  collaborators?: IApiCollaborator[];
}> = ({ note, collaborators, type }) => {
  const navigate = useNavigate();
  return (
    <div
      className="shadow-sm animate__fadeIn animate__animated w-full  pt-3 pb-1 h-[180px] 3micro:w-[300px] rounded-md gap-y-2 flex flex-col "
      style={{ border: "1px solid #353535" }}
      key={note.id}
    >
      <div
        className="flex justify-between px-4"
        onClick={() => navigate(`/${encodeToBase62(note.id)}`)}
      >
        <span className="font-[500] text-[#fff] text-md">{note.title}</span>
      </div>

      <section
        onClick={() => navigate(`/${encodeToBase62(note.id)}`)}
        className="hover:bg-[#292929]   duration-300 cursor-pointer text-gray-300 h-[65%] overflow-hidden  px-4 text-sm block h-full  ql-container ql-snow quill ql-editor"
        dangerouslySetInnerHTML={{ __html: note.content }}
      ></section>

      <div className="flex  text-gray-400 cursor-pointer px-4 items-center justify-between gap-x-2">
        {collaborators && (
          <AvatarGroup
            size="2"
            avatars={collaborators.map((i) => ({
              name: i["user.name"],
              src: "",
            }))}
          />
        )}
        <div className="flex items-center gap-x-2">
          <DisplayDateCreated date={note.createdAt} />
          <IoBookmarkOutline />
          <MoreOptionsOnNotePopup note={note} noteType={type} />
        </div>
      </div>
    </div>
  );
};

export const NoteSkeleton = () => (
  <div className="shadow-sm w-full pt-3 pb-1 h-[180px] 3micro:w-[300px] rounded-md gap-y-2 flex flex-col">
    <div className="h-4 bg-zinc-600 animate-pulse rounded w-3/4 mx-4"></div>

    <div className="flex flex-col gap-y-2 px-4 h-[65%]">
      <div className="h-4 animate-pulse bg-zinc-600 rounded w-full"></div>
      <div className="h-4 animate-pulse bg-zinc-600 rounded w-5/6"></div>
      <div className="h-4 animate-pulse bg-zinc-600 rounded w-4/6"></div>
    </div>

    <div className="flex justify-between items-center px-4 gap-x-2">
      <div className="flex gap-x-2">
        <div className="animate-pulse h-6 w-6 bg-zinc-600 rounded-full"></div>
        <div className="animate-pulse h-6 w-6 bg-zinc-600 rounded-full"></div>
        <div className="animate-pulse h-6 w-6 bg-zinc-600 rounded-full"></div>
      </div>
      <div className="flex items-center gap-x-2">
        <div className="animate-pulse h-4 w-10 bg-zinc-600 rounded"></div>
        <div className="animate-pulse h-4 w-4 bg-zinc-600 rounded-full"></div>
        <div className="animate-pulse h-4 w-4 bg-zinc-600 rounded-full"></div>
      </div>
    </div>
  </div>
);

const MoreOptionsOnNotePopup: FC<{
  note: INote;
  noteType: "template" | "note";
}> = ({ note, noteType }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const displayDropdown = () => {
    setDropdownVisible((prev) => !prev); // Toggle dropdown visibility
  };
  return (
    <div className="relative sharepopup">
      <CiCircleMore onClick={displayDropdown} className="text-[1.25rem]" />
      {isDropdownVisible && (
        <div
          className={`popup_child animate__animated ${
            isDropdownVisible
              ? "animate__zoomIn visible opacity-1"
              : "animate__zoomOut invisible opacity-0"
          }`}
        >
          {noteType === "template" && (
            <li
              className="dropdown_item"
              style={{ borderBottom: "5px solid #2121218c" }}
            >
              <VscNotebookTemplate /> Use Template
            </li>
          )}
          <li
            className="dropdown_item"
            onClick={() => {
              navigator.clipboard
                .writeText("https://notalx.com/" + encodeToBase62(note.id))
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
                  "https://notalx.com/" + encodeToBase62(note.id)
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
                  "https://notalx.com/" + encodeToBase62(note.id)
                )}`
              );
              displayDropdown();
            }}
          >
            <BiLogoTelegram className="text-[#0088cc]" /> Share to Telegram
          </li>{" "}
        </div>
      )}
    </div>
  );
};

const TaskSharingPopup: FC<{ task: ITask }> = ({ task }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const displayDropdown = () => {
    setDropdownVisible((prev) => !prev); // Toggle dropdown visibility
  };
  return (
    <div className="relative sharepopup">
      <div
        className={`popup_child z-[1000] animate__animated ${
          isDropdownVisible
            ? "animate__zoomIn visible opacity-1"
            : "animate__zoomOut invisible opacity-0"
        }`}
      >
        <li
          className="dropdown_item"
          onClick={() => {
            navigator.clipboard
              .writeText("https://notalx.com/task" + encodeToBase62(task.id))
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
                "https://notalx.com/task" + encodeToBase62(task.id)
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
                "https://notalx.com/task" + encodeToBase62(task.id)
              )}`
            );
            displayDropdown();
          }}
        >
          <BiLogoTelegram className="text-[#0088cc]" /> Share to Telegram
        </li>{" "}
      </div>
      <IoShareSocialOutline onClick={displayDropdown} />
    </div>
  );
};

export const RingsLoader = () => (
  <RotatingLines
    visible={true}
    strokeColor="#bbbbbb"
    width="17"
    strokeWidth="5"
    animationDuration="0.75"
    ariaLabel="rotating-lines-loading"
  />
);
export const PuffLoader = () => (
  <Puff
    visible={true}
    width="17"
    height="17"
    color="#4fa94d"
    ariaLabel="puff-loading"
    wrapperStyle={{}}
    wrapperClass=""
  />
);
