import { useContext, useEffect, useState } from "react";
import { IoCreateOutline, IoPersonAdd } from "react-icons/io5";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthorisedInfo,
  Button,
  DisplayDateCreated,
  SearchDropdown,
  SharedHeader,
  SingleNote,
} from "./component";
import { encodeToBase62, fetchAliasPublicAndPrivateNotes } from "./utils";
import { GlobalContext } from "./hook";
import { MdDeleteOutline } from "react-icons/md";
import { VscLock } from "react-icons/vsc";
import { INote } from "../type";
import { IoHomeOutline } from "react-icons/io5";

const AuthorisedAliasNotes = () => {
  const { otpExpiry } = useContext(GlobalContext)!;

  const [notes, setNotes] = useState<INote[]>([]);

  useEffect(() => {
    try {
      fetchAliasPublicAndPrivateNotes().then((res) => {
        res.data && setNotes(res.data.notes);
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <section className="top_space">
      <SharedHeader />
      <header className="subtext py-2">
        <span className="flex items-center gap-x-2">
          <Link to={"/"}>
            <IoHomeOutline />
          </Link>
          /<Link to={"/auth-with-alias"}> {otpExpiry?.name} </Link>/
          <span>notes </span>
        </span>
      </header>
      {notes && notes.length > 0 && (
        <section className="w-full top_space py-5 mb-3">
          <div className="flex gap-4 flex-wrap">
            {notes.map((i, key) => (
              <SingleNote note={i} key={i.id} />
            ))}
          </div>
        </section>
      )}
    </section>
  );
};

export default AuthorisedAliasNotes;
