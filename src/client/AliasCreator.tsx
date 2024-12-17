import { FC, useState } from "react";
import { ImCancelCircle, ImInfo } from "react-icons/im";
import { Button, InputWithIcon } from "./component";
import { IoMailOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

interface ICreateAlias {}

const CreateAlias: FC<ICreateAlias> = () => {
  const [alias, setAlias] = useState({ name: "", email: "" });

  const navigate = useNavigate();

  const send = async () => {
    const f = await fetch("/api/alias", {
      method: "post",
      body: JSON.stringify(alias),
      headers: {
        "content-type": "application/json",
      },
    });
    const response = await f.json();
    alert(response.message);

    if (response.status === "ok") {
      navigate("/");
    }
  };

  return (
    <div className="modal animate__animated animate__slideInDown">
      <div
        style={{ border: "1px solid #535353" }}
        className="flex mt-7 flex-col gap-y-3 relative 3micro:w-[400px] sm:w-[600px] shadow-md px-5 py-5 rounded-md"
      >
        <h3 className="text-[1.1rem] font-[500]">Create an alias</h3>
        <div className="flex items-start gap-x-3 ">
          <ImInfo />
          <ol className="text-gray-300 text-sm list-decimal pl-4">
            <li>
              Providing an email address is optional but highly recommended.
            </li>
            <li>It allows you to recover your secret key if it's ever lost.</li>
            <li>
              Without an email, lost secrets cannot be retrieved, and your notes
              may become inaccessible.
            </li>
          </ol>
        </div>

        <div className="absolute right-[10px]">
          <ImCancelCircle onClick={() => navigate("/")} />
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
            <label>Recovery email (Optional)</label>
            <InputWithIcon
              placeholder=""
              type="email"
              value={alias.email}
              onChange={(value) =>
                setAlias((prev) => ({ ...prev, email: value }))
              }
            />
          </div>
        </div>

        <div className="flex w-full justify-end">
          <Button text="Create" onClick={send} />
        </div>
      </div>
    </div>
  );
};
export default CreateAlias;
