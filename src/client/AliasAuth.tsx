import { useContext, useEffect, useRef, useState } from "react";
import { Button, InputWithIcon, SearchDropdown } from "./component";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "./hook";
import { IoArrowBackOutline } from "react-icons/io5";
import { _IAlias, IApiResponse, IOtpExpiry } from "../type";
import { encodeToBase62, getOTPExpiry, isSessionExpired } from "./utils";

const AliasAuth = () => {
  const [info, setInfo] = useState({ otp: "", email: "" });
  const [otpExpiry, setOtpExpiry] = useState<IOtpExpiry | null>(null);

  const [selectedAlias, setSelectedAlias] = useState<_IAlias | null>(null);

  const hasCalled = useRef(false);

  useEffect(() => {
    if (!hasCalled.current) {
      getOTPExpiry().then((res) => {
        if (res && res !== undefined) {
          setOtpExpiry(res);
        }
      });

      hasCalled.current = true;
    }
  }, []);

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
    if (response.status === "ok") {
      location.href = "/?alias=" + encodeToBase62(selectedAlias!.id!);
    }
  };
  const deleteAuth = async (refreshPath: "currentPage" | "homePage") => {
    const e = prompt("Are u sure? Enter alias to confirm:");

    if (e !== otpExpiry?.name) {
      alert("Aborted");
      return;
    }

    const f = await fetch("/api/otp/invalidate", {
      method: "delete",
    });
    const response = await f.json();
    if (response.status === "err") return;

    if (refreshPath === "currentPage") {
      document.location.href = document.location.href;
    } else {
      document.location.href = "/";
    }
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
                  onClick={() => deleteAuth("homePage")}
                />
                <Button
                  text="Re authorise"
                  onClick={() => deleteAuth("currentPage")}
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
                <label>Select alias</label>
                <SearchDropdown
                  onClick={(value) => setSelectedAlias(value)}
                  selected={selectedAlias}
                />
              </div>
              <div className="flex items-end gap-x-3">
                <div className="label_input">
                  <label>Enter your email</label>
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
                <label>OTP</label>
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
