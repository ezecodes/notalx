import { useContext, useEffect, useState } from "react";
import { IoCreateOutline, IoPersonAdd } from "react-icons/io5";
import { INote, IOtpExpiry } from "../type";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { Button, SearchDropdown } from "./component";
import {
  decodeFromBase62,
  encodeToBase62,
  fetchAliasNotes,
  formatRelativeTime,
  getOTPExpiry,
  parseUrl,
} from "./utils";
import { GlobalContext } from "./hook";
import { BsPersonCheck } from "react-icons/bs";
import { isSessionExpired } from "./utils";

const Home = () => {
  const navigate = useNavigate();
  const { selectedAlias, setSelectedAlias } = useContext(GlobalContext)!;
  const [searchParams] = useSearchParams();
  const [otpExpiry, setOtpExpiry] = useState<IOtpExpiry | null>(null);

  const [selectedNotes, setSelectedNotes] = useState<INote[]>([]);

  const fetchNotes = (aliasId?: string) => {
    if (!aliasId || aliasId === undefined) return;
    fetchAliasNotes(aliasId).then((res) => {
      if (res.status === "ok" && res.data) {
        setSelectedNotes(res.data.notes);
        setSelectedAlias(res.data.alias);
      }
    });
  };

  useEffect(() => {
    try {
      const url = parseUrl(document.location);
      if (url.requestQuery.r) {
        navigate(decodeURIComponent(url.requestQuery.r));
      }
      const alias = searchParams.get("alias");
      if (alias) {
        fetchNotes(decodeFromBase62(alias));
      }
      getOTPExpiry().then((res) => {
        if (res && res !== undefined) {
          setOtpExpiry(res);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchNotes(selectedAlias?.id);
    selectedAlias && navigate("/?alias=" + encodeToBase62(selectedAlias.id!));
  }, [selectedAlias?.id]);

  return (
    <section className="flex flex-col justify-center items-center w-full">
      <header className="flex flex-col py-4 gap-y-5 w-full items-center px-3">
        <div className="flex flex-row gap-x-5 flex-wrap sm:flex-nowrap gap-y-2 items-center justify-center">
          <Button
            text="New alias"
            icon={<IoPersonAdd />}
            onClick={() => navigate("/newalias")}
          />
          <Button
            text="Create note"
            icon={<IoCreateOutline />}
            onClick={() => {
              navigate("/newnote");
            }}
          />
          <form className="w-full flex items-center gap-x-2 mt-3 sm:mt-0 justify-center  gap-y-2">
            <div className="flex 3micro:w-[auto] w-[80%] items-center gap-x-3">
              <SearchDropdown
                onClick={(value) => setSelectedAlias(value)}
                selected={selectedAlias}
              />
            </div>

            <div
              onClick={() => navigate("/auth-with-alias")}
              className="flex w-[15%] 3micro:w-[auto] cursor-pointer px-2 py-2 rounded-sm items-center gap-x-2  hover:bg-[rgba(0,0,0,.1)] duration-300"
            >
              <BsPersonCheck
                className={` ${
                  otpExpiry && !isSessionExpired(otpExpiry.expiry)
                    ? "text-green-400"
                    : "text-white"
                } text-[25px]   `}
              />
              <span className="subtext hidden 3micro:inline text-sm">
                {otpExpiry?.name}
              </span>
            </div>
          </form>
        </div>
      </header>

      {selectedAlias && selectedNotes && selectedNotes.length > 0 && (
        <section className="w-full px-10 py-5 mb-3">
          {/* <h3>Browsing notes: {selectedAlias?.name}</h3> */}
          <div className="flex gap-4 flex-wrap">
            {selectedNotes.map((i, key) => {
              return (
                <div
                  className="shadow-sm w-full  py-2 h-[200px] 2micro:w-[300px] rounded-md gap-y-2 flex flex-col overflow-hidden"
                  style={{ border: "1px solid #353535" }}
                  key={i.id}
                >
                  <div className="flex justify-between px-4">
                    <span className="font-[500] text-[1.1rem]">{i.title}</span>
                  </div>

                  <Link
                    to={i.slug}
                    className="hover:bg-[#292929] duration-300 cursor-pointer text-gray-300 h-[65%] overflow-hidden  px-4"
                  >
                    <span
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: i.content }}
                    ></span>
                  </Link>

                  <div className="flex  px-4 items-center justify-end gap-x-5">
                    <span className="text-gray-400 text-sm">
                      {formatRelativeTime(i.createdAt)}{" "}
                    </span>
                    <IoCreateOutline />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <Outlet />
    </section>
  );
};

export default Home;
