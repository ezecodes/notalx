import "react-quill/dist/quill.snow.css";
import "choices.js/public/assets/styles/choices.min.css";
import "react-toastify/dist/ReactToastify.css";

import { FC, useEffect, useState } from "react";
import {
  IoCreateOutline,
  IoEyeOffOutline,
  IoMailOutline,
  IoPersonAdd,
} from "react-icons/io5";
import { ImCancelCircle, ImInfo } from "react-icons/im";
import { _Alias, INote } from "../type";
import { Outlet, useNavigate } from "react-router-dom";
import { Button, InputWithIcon, SearchDropdown } from "./component";
import { fetchAliasNotes, formatRelativeTime } from "./utils";

const Page = () => {
  const navigate = useNavigate();

  const [isCreateAliasModalVisible, setCreateAliasModalVisibility] =
    useState(false);

  const [selectedAlias, setSelectedAlias] = useState<_Alias | null>(null);
  const [selectedNote, setSelectedNote] = useState<INote | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<{
    id: string;
    rows: INote[];
  } | null>(null);

  useEffect(() => {
    if (!selectedAlias) return;
    fetchAliasNotes(selectedAlias?.id).then((res) => {
      console.log(res);
      res.data && setSelectedNotes({ id: "", rows: res.data.rows });
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
            onClick={() => navigate("/edit")}
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
      <Outlet />
    </section>
  );
};

export default Page;

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
