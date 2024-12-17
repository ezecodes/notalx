import { FC, useContext, useState } from "react";
import { Button, InputWithIcon } from "./component";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "./hook";
import { IoArrowBackOutline } from "react-icons/io5";

interface IAliasAuth {}

const AliasAuth: FC<IAliasAuth> = () => {
  const [info, setInfo] = useState({ otp: "", email: "" });
  const { selectedAlias } = useContext(GlobalContext)!;

  const navigate = useNavigate();

  const send = async () => {
    const f = await fetch("/api/otp/send", {
      method: "post",
      body: JSON.stringify({ email: info.email, alias_id: selectedAlias?.id }),
      headers: {
        "content-type": "application/json",
      },
    });
    const response = await f.json();
    alert(response.message);
  };

  return (
    <div className="modal animate__animated animate__slideInDown">
      <div
        style={{ border: "1px solid #535353" }}
        className="flex mt-7 flex-col gap-y-3 relative 3micro:w-[400px] sm:w-[600px] shadow-md px-5 py-5 rounded-md"
      >
        <h3 className="text-[1.1rem] font-[500]">
          Authorize <strong>{selectedAlias?.name}</strong> with OTP
        </h3>

        <div
          onClick={() => navigate("/")}
          className="absolute flex items-center cursor-pointer text-sm subtext gap-x-1 right-[10px]"
        >
          <IoArrowBackOutline />
          Back
        </div>

        <div className="flex flex-col gap-y-3">
          <div className="label_input">
            <label>Selected Alias</label>
            <InputWithIcon
              placeholder=""
              type="text"
              value={selectedAlias?.name ? selectedAlias?.name : "N/A"}
              onChange={(value) => {}}
              disabled={true}
            />
          </div>
          <div className="flex items-end gap-x-3">
            <div className="label_input">
              <label>Enter you email</label>
              <InputWithIcon
                placeholder=""
                type="text"
                value={info.email}
                onChange={(value) =>
                  setInfo((prev) => ({ ...prev, email: value }))
                }
              />
            </div>
            {info.email !== "" && <Button text="Send" onClick={send} />}
          </div>

          <div className="label_input">
            <label>OPT</label>
            <InputWithIcon
              placeholder=""
              type="text"
              value={info.otp}
              onChange={(value) => setInfo((prev) => ({ ...prev, otp: value }))}
            />
          </div>
        </div>

        <div className="flex w-full justify-end">
          <Button text="Verify OTP" onClick={send} />
        </div>
      </div>
    </div>
  );
};
export default AliasAuth;
