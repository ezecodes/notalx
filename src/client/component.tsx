import { FC, ReactNode, useEffect, useState } from "react";
import {
  encodeToBase62,
  fetchAllAlias,
  formatRelativeTime,
  searchAliasByName,
} from "./utils";
import { ImCancelCircle } from "react-icons/im";
import { _IAlias, IOtpExpiry } from "../type";
import { Link, useNavigate } from "react-router-dom";
import { TfiTimer } from "react-icons/tfi";
import { BsPersonCheck, BsUnlock } from "react-icons/bs";
import { VscLock } from "react-icons/vsc";

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

const getActionStyle = (action: Action) => {
  if (action === "delete") {
  }
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
    <div className="relative w-full sm:w-[300px] ">
      <div className="w-full px-2 input bg-transparent border border-gray-300 rounded-md  flex items-center">
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
  time: string;
}

export const ExpirationInfo: FC<IExInfo> = ({ willSelfDestroy, time }) => {
  if (willSelfDestroy) {
    return (
      <button
        className={`text-sm flex items-center gap-x-2 text-gray-300`}
        type={"button"}
        disabled
      >
        {new Date(time).toLocaleDateString()}
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
  return <span className="text-sm subtext">{formatRelativeTime(date)}</span>;
};

interface IAi {
  onClick?: () => void;
  clickUrl: any;
  otpExpiry: IOtpExpiry | null;
}
export const AuthorisedInfo: FC<IAi> = ({ clickUrl, otpExpiry }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(clickUrl as any)}
      className="flex cursor-pointer px-2 py-2 rounded-sm items-center gap-x-2  hover:bg-[rgba(0,0,0,.1)] duration-300"
    >
      <BsPersonCheck
        className={` ${
          otpExpiry?.is_valid_auth ? "text-green-400" : "text-white"
        } text-[25px]   `}
      />
      <span className="subtext hidden 3micro:inline text-sm">
        {otpExpiry?.name}
      </span>
    </div>
  );
};
