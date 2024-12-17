import { FC, useEffect, useState } from "react";
import {
  IoCreateOutline,
  IoEyeOffOutline,
  IoMailOutline,
  IoPersonAdd,
} from "react-icons/io5";
import { ImCancelCircle, ImInfo } from "react-icons/im";
import { IAlias, INote } from "../type";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button, InputWithIcon, SearchDropdown } from "./component";
import { fetchAliasNotes, formatRelativeTime, parseUrl } from "./utils";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const url = parseUrl(document.location);
      if (url.requestQuery.r) {
        navigate(decodeURIComponent(url.requestQuery.r));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);
  const [selectedAlias, setSelectedAlias] = useState<Partial<IAlias> | null>(
    null
  );
  const [selectedNotes, setSelectedNotes] = useState<{
    id: string;
    rows: INote[];
  } | null>(null);

  useEffect(() => {
    if (!selectedAlias) return;
    fetchAliasNotes(selectedAlias.id!).then((res) => {
      console.log(res);
      res.data && setSelectedNotes({ id: "", rows: res.data.rows });
    });
  }, [selectedAlias?.id]);

  return (
    <section className="flex flex-col justify-center items-center w-full">
      <header className="flex flex-col py-4 gap-y-5 w-full items-center ">
        <div className="flex flex-row gap-x-5">
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
          <form className="w-full flex justify-center">
            <div className="flex items-center gap-x-3">
              <SearchDropdown
                onClick={(value) => setSelectedAlias(value)}
                selected={selectedAlias}
              />
            </div>
          </form>
        </div>
      </header>

      {selectedAlias && selectedNotes && selectedNotes?.rows.length > 0 && (
        <section className="w-full px-10 py-5 mb-3">
          {/* <h3>Browsing notes: {selectedAlias?.name}</h3> */}
          <div className="flex gap-4">
            {selectedNotes?.rows.map((i, key) => {
              return (
                <div
                  className="shadow-md py-2 h-[200px] 2micro:w-[400px] rounded-md gap-y-2 flex flex-col overflow-hidden"
                  style={{ border: "1px solid #555555" }}
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
