"use client";

import { FC, useState } from "react";
import { BackButton, Button, InputWithIcon } from "../../_components/shared";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { API_BASE_URL } from "@/env";

interface ICreateUser {}

const CreateUser: FC<ICreateUser> = () => {
  const [user, setUser] = useState({ name: "", email: "" });

  const router = useRouter();

  const send = async () => {
    const f = await fetch(API_BASE_URL + "/api/user", {
      method: "post",
      body: JSON.stringify(user),
      headers: {
        "content-type": "application/json",
      },
    });
    const response = await f.json();

    if (response.status === "ok") {
      toast.success(response.message);
      router.push("/login");
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
              Lastly! Useres are public, therefore do not use sensitive words
              for an user
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
              value={user.name}
              onChange={(value) =>
                setUser((prev) => ({ ...prev, name: value }))
              }
            />
          </div>

          <div className="label_input">
            <label>Email</label>
            <InputWithIcon
              name="Email"
              placeholder=""
              type="email"
              value={user.email}
              onChange={(value) =>
                setUser((prev) => ({ ...prev, email: value }))
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
export default CreateUser;
