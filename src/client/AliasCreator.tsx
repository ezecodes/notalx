import { FC, useState } from "react";
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

    if (response.status === "ok") {
      toast.success(response.message);
      navigate("/login");
    } else {
      toast.error(response.message);
    }
  };

  return (
    <div className="modal  ">
      <div className="flex mt-7 flex-col gap-y-3 relative  sm:w-[450px] 3micro:w-[90%] w-full px-5 py-5 rounded-md">
        <BackButton text={"Create an account"} url={-1} />
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
            <label>Enter a name</label>
            <InputWithIcon
              placeholder="Start typing.."
              type="text"
              name="Full name"
              value={alias.name}
              onChange={(value) =>
                setAlias((prev) => ({ ...prev, name: value }))
              }
            />
          </div>

          <div className="label_input">
            <label>Email</label>
            <InputWithIcon
              name="Email"
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
