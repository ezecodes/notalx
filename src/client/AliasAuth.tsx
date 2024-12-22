import { useContext, useEffect, useRef, useState } from "react";
import { BackButton, Button, InputWithIcon, SearchDropdown } from "./component";
import { useNavigate, useSearchParams } from "react-router-dom";
import { _IAlias } from "../type";
import { decodeFromBase62, fetchAlias } from "./utils";
import { GlobalContext } from "./hook";
import { toast } from "react-toastify";

const AliasAuth = () => {
  const [info, setInfo] = useState({ otp: "", email: "" });
  const { otpExpiry, getOTPExpiry, isAuthorised } = useContext(GlobalContext)!;
  const [selectedAlias, setSelectedAlias] = useState<_IAlias | null>(null);

  const hasCalled = useRef(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!hasCalled.current) {
      let alias = searchParams.get("alias");
      if (alias) {
        fetchAlias(decodeFromBase62(alias)).then((res) => {
          res.status === "ok" && setSelectedAlias(res.data!);
        });
      }

      getOTPExpiry();

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
    toast(response.message);
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
    toast(response.message);
    if (response.status === "ok") {
      getOTPExpiry();
      navigate(-1);
    }
  };
  const deleteAuth = async (refreshPath: "currentPage" | "homePage") => {
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
      <div className="flex mt-7 flex-col gap-y-3 relative modal_child px-5 py-5  ">
        <BackButton
          text={
            isAuthorised() ? "You are authorised" : "Authorize alias with OTP"
          }
          url={-1}
        />
        {isAuthorised() ? (
          <>
            <div className="flex flex-col gap-y-3">
              <div className="label_input">
                <label>Authorised Alias</label>
                <InputWithIcon
                  placeholder=""
                  type="text"
                  value={otpExpiry!.name}
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
                {info.email !== "" && <Button text="Send OTP" onClick={send} />}
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
