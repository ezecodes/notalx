import { useContext, useEffect, useState } from "react";
import { IoCreateOutline, IoPersonAdd } from "react-icons/io5";
import { IApiResponse, INote, IOtpExpiry } from "../type";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { Button, SearchDropdown } from "./component";
import {
  decodeFromBase62,
  encodeToBase62,
  fetchAliasNotes,
  formatRelativeTime,
  parseUrl,
} from "./utils";
import { GlobalContext } from "./hook";
import { BsPersonCheck } from "react-icons/bs";
import { isSessionExpired } from "./utils";
import { MdDeleteOutline } from "react-icons/md";
import { VscLock } from "react-icons/vsc";

const Home = () => {
  const navigate = useNavigate();
  const {
    selectedAlias,
    setSelectedAlias,
    otpExpiry,
    getOTPExpiry,
    fetchNotes,
    selectedNotes,
    deleteNote,
  } = useContext(GlobalContext)!;
  const [searchParams] = useSearchParams();

  useEffect(() => {
    try {
      const url = parseUrl(document.location);
      if (url.requestQuery.r) {
        navigate(decodeURIComponent(url.requestQuery.r));
      }
      let alias = searchParams.get("alias");
      if (alias) {
        alias = decodeFromBase62(alias);
        fetchNotes();
      }

      getOTPExpiry();
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
                    {i.is_hidden && <VscLock className="text-[#a7a7a7]" />}
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

                  <div className="flex  text-gray-400 cursor-pointer px-4 items-center justify-end gap-x-2">
                    <span className="text-sm">
                      {new Date(i.createdAt).toLocaleDateString()}
                    </span>
                    {otpExpiry && !isSessionExpired(otpExpiry.expiry) ? (
                      <>
                        <MdDeleteOutline onClick={() => deleteNote(i.id)} />
                        <IoCreateOutline
                          onClick={() => navigate("/edit/" + i.slug)}
                        />
                      </>
                    ) : (
                      <></>
                    )}
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
