import { useContext, useEffect, useRef, useState } from "react";
import { Button, InputWithIcon, SearchDropdown } from "./component";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";
import { _IAlias } from "../type";
import { decodeFromBase62, encodeToBase62, fetchAlias } from "./utils";
import { GlobalContext } from "./hook";

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
      if (searchParams.get("alias")) {
        getOTPExpiry();
        navigate(-1);
      }
      // location.href = "/?alias=" + encodeToBase62(selectedAlias!.id!);
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
      <div
        style={{ border: "1px solid #535353" }}
        className="flex mt-7 flex-col gap-y-3 relative modal_child shadow-md px-5 py-5 rounded-md"
      >
        {isAuthorised() ? (
          <>
            <div className="flex gap-x-3">
              <button
                onClick={() => navigate(-1)}
                className="  flex items-center cursor-pointer subtext gap-x-1 "
              >
                <IoArrowBackOutline />
                Back
              </button>
              <h3 className="text-[1.1rem] font-[500]">You are authorised</h3>
            </div>

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
            <div className="flex justify-between">
              <h3 className="text-[1.2rem] font-[500]">
                Authorize alias with OTP
              </h3>
              <button
                onClick={() => navigate(-1)}
                className="  flex items-center cursor-pointer  subtext gap-x-1 "
              >
                <IoArrowBackOutline />
                Back
              </button>
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
