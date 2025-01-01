import { FC, useContext, useEffect, useState } from "react";
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
import { encodeToBase62 } from "./utils";
import { GlobalContext } from "./hook";
import { MdDeleteOutline } from "react-icons/md";
import { VscLock } from "react-icons/vsc";
import { ApiFetchNote } from "../type";
type Tab = "notes" | "bookmarks" | "public";

const RenderNotes: FC<{ notes: ApiFetchNote[] }> = ({ notes }) => {
  return notes.map((i, key) => (
    <SingleNote collaborators={i.collaborators} note={i.note} key={i.note.id} />
  ));
};

const Home = () => {
  const navigate = useNavigate();
  const {
    getOTPExpiry,
    fetchNotes,
    publicNotes,
    authAliasNotes,
    fetchAliasNotes,
    otpExpiry,
  } = useContext(GlobalContext)!;
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("public");

  useEffect(() => {
    try {
      const redirect = searchParams.get("r");

      if (redirect) {
        navigate(decodeURIComponent(redirect), { replace: true });
      }

      fetchNotes();
      fetchAliasNotes();

      getOTPExpiry();
    } catch (err) {
      console.error(err);
    }
  }, [navigate, searchParams]);

  return (
    <section className="page">
      <SharedHeader />

      <div className="flex items-start top_space gap-x-3  w-full">
        <button
          onClick={() => setActiveTab("public")}
          className={`sub_button ${
            activeTab === "public" ? "text-white" : "subtext"
          } `}
        >
          Public notes
        </button>

        {otpExpiry?.is_valid_auth && (
          <button
            onClick={() => setActiveTab("notes")}
            className={`sub_button ${
              activeTab === "notes" ? "text-white" : "subtext"
            } `}
          >
            My notes
          </button>
        )}

        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`sub_button ${
            activeTab === "bookmarks" ? "text-white" : "subtext"
          } `}
        >
          Bookmarks
        </button>
      </div>

      {
        <section className="w-full top_space py-5 mb-3">
          <div className="flex gap-4 flex-wrap">
            <RenderNotes
              notes={activeTab === "public" ? publicNotes : authAliasNotes}
            />
          </div>
        </section>
      }
      <Outlet />
    </section>
  );
};

export default Home;
