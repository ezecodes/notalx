import { useContext, useEffect, useRef, useState } from "react";
import { Button, InputWithIcon } from "./component";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "./hook";
import { IoArrowBackOutline } from "react-icons/io5";
import { IApiResponse } from "../type";
import { isSessionExpired } from "./utils";

interface IOtpExpiry {
  expiry: string;
  alias_id: string;
  name: string;
}

const AliasAuth = () => {
  const [info, setInfo] = useState({ otp: "", email: "" });
  const [otpExpiry, setOtpExpiry] = useState<IOtpExpiry | null>(null);

  const { selectedAlias } = useContext(GlobalContext)!;

  const hasCalled = useRef(false);

  useEffect(() => {
    if (!hasCalled.current) {
      getOTPExpiry();

      hasCalled.current = true;
    }
  }, []);

  const getOTPExpiry = async () => {
    const f = await fetch("/api/otp/expiry");
    const response: IApiResponse<IOtpExpiry> = await f.json();
    if (response.status === "ok") {
      setOtpExpiry(response.data!);
    } else {
      setOtpExpiry(null);
    }
  };

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
  const verify = async () => {
    const f = await fetch("/api/otp/verify", {
      method: "post",
      body: JSON.stringify({ email: info.email, code: info.otp }),
      headers: {
        "content-type": "application/json",
      },
    });
    const response = await f.json();
    alert(response.message);
  };
  const deleteAuth = async () => {
    const f = await fetch("/api/otp/invalidate", {
      method: "delete",
    });
    await f.json();
  };

  return (
    <div className="modal animate__animated animate__slideInDown">
      <div
        style={{ border: "1px solid #535353" }}
        className="flex mt-7 flex-col gap-y-3 relative modal_child shadow-md px-5 py-5 rounded-md"
      >
        {otpExpiry && !isSessionExpired(otpExpiry.expiry) ? (
          <>
            <h3 className="text-[1.1rem] font-[500]">You are authorised</h3>
            <div
              onClick={() => navigate("/")}
              className="absolute flex items-center cursor-pointer text-sm subtext gap-x-1 right-[10px]"
            >
              <IoArrowBackOutline />
              Back
            </div>
            <div className="flex flex-col gap-y-3">
              <div className="label_input">
                <label>Authorised Alias</label>
                <InputWithIcon
                  placeholder=""
                  type="text"
                  value={otpExpiry.name}
                  onChange={(value) => {}}
                  disabled={true}
                />
              </div>
              <div className="flex w-full gap-x-3 justify-end">
                <Button
                  text="Delete Auth"
                  onClick={() => {
                    deleteAuth().then(() => {
                      document.location.href = "/";
                    });
                  }}
                />
                <Button
                  text="Re authorise"
                  onClick={() => {
                    deleteAuth().then(() => {
                      document.location.href = document.location.href;
                    });
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[1.1rem] font-[500]">
              Authorize alias with OTP
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
                  onChange={(value) =>
                    setInfo((prev) => ({ ...prev, otp: value }))
                  }
                />
              </div>
            </div>

            <div className="flex w-full justify-end">
              <Button text="Verify OTP" onClick={verify} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default AliasAuth;
