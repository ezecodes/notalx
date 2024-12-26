import { FC, useState } from "react";
import { ImInfo } from "react-icons/im";
import { BackButton, Button, InputWithIcon } from "./component";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
    toast(response.message);

    if (response.status === "ok") {
      navigate("/");
    }
  };

  return (
    <div className="modal animate__animated animate__slideInDown">
      <div className="flex mt-7 flex-col gap-y-3 relative modal_child px-5 py-5 rounded-md">
        <BackButton text={"Create an alias"} url={-1} />
        {/* <div className="flex items-start gap-x-3 ">
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
            <li>
              Lastly! Aliases are public, therefore do not use sensitive words
              for an alias
            </li>
          </ol>
        </div> */}

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
