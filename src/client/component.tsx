import { FC, ReactNode, useEffect, useState } from "react";
import { encodeToBase62, fetchAllAlias, searchAliasByName } from "./utils";
import { ImCancelCircle } from "react-icons/im";
import { _IAlias } from "../type";
import { Link } from "react-router-dom";

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
}) => {
  return (
    <button
      className="primary_button "
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
    <div className="relative  2micro:w-[300px] ">
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
