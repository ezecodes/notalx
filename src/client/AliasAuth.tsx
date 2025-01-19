import { useContext, useEffect, useRef, useState } from "react";
import { BackButton, Button, InputWithIcon } from "./component";
import { _IUser, IApiResponse } from "../../type";
import { GlobalContext } from "./hook";
import { toast } from "react-toastify";

const UserAuth = () => {
  const [info, setInfo] = useState({ otp: "", email: "" });
  const { otpExpiry, getOTPExpiry, isAuthorised } = useContext(GlobalContext)!;
  const hasCalled = useRef(false);

  const [displayOtpInput, setOtpInput] = useState(false);

  useEffect(() => {
    if (!hasCalled.current) {
      getOTPExpiry();

      hasCalled.current = true;
    }
  }, []);

  const send = async () => {
    const f = await fetch("/api/otp/send", {
      method: "post",
      body: JSON.stringify({ email: info.email }),
      headers: {
        "content-type": "application/json",
      },
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "ok") {
      setOtpInput(true);
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
  };
  const verify = async () => {
    const f = await fetch("/api/otp/verify", {
      method: "post",
      body: JSON.stringify({ email: info.email, code: info.otp }),
      headers: {
        "content-type": "application/json",
      },
    });
    const response: IApiResponse<null> = await f.json();

    if (response.status === "ok") {
      document.location.href = "/";
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
  };
  const deleteAuth = async (refreshPath: "currentPage" | "homePage") => {
    const f = await fetch("/api/otp/invalidate", {
      method: "delete",
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") return;

    if (refreshPath === "currentPage") {
      document.location.href = document.location.href;
    } else {
      document.location.href = "/";
    }
  };

  return (
    <div className="modal  ">
      <div className="flex mt-7 flex-col gap-y-3 relative sm:w-[450px] 3micro:w-[90%] w-full px-5 py-5  ">
        <BackButton
          text={isAuthorised() ? "You are logged in" : "Login with OTP"}
          url={-1}
        />
        {isAuthorised() ? (
          <>
            <div className="flex flex-col gap-y-3">
              <div className="label_input">
                <label>Logged In As:</label>
                <InputWithIcon
                  placeholder=""
                  type="text"
                  value={otpExpiry!.name}
                  onChange={(value) => {}}
                  disabled={true}
                />
              </div>
              <div className="flex w-full gap-x-3 justify-end">
                <Button text="Log out" onClick={() => deleteAuth("homePage")} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-y-3">
              <form
                className="flex flex-col items-end gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <div className="label_input">
                  <InputWithIcon
                    label="Email"
                    placeholder="Enter your email"
                    type="email"
                    value={info.email}
                    onChange={(value) =>
                      setInfo((prev) => ({ ...prev, email: value }))
                    }
                  />
                </div>
                {info.email.trim() !== "" && (
                  <Button type="submit" text="Send OTP" onClick={() => {}} />
                )}
              </form>
              {displayOtpInput && (
                <form
                  className="flex flex-col animate__animated animate__fadeIn items-end gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    verify();
                  }}
                >
                  <div className="label_input">
                    <label>OTP</label>
                    <InputWithIcon
                      placeholder="Type OTP code here"
                      type="number"
                      value={info.otp}
                      onChange={(value) =>
                        setInfo((prev) => ({ ...prev, otp: value }))
                      }
                    />
                  </div>
                  <Button text="Verify OTP" type="submit" onClick={() => {}} />
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default UserAuth;
