import { useContext, useEffect } from "react";
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

const Home = () => {
  const navigate = useNavigate();
  const { selectedAlias, getOTPExpiry, fetchNotes, selectedNotes } =
    useContext(GlobalContext)!;
  const [searchParams] = useSearchParams();

  useEffect(() => {
    try {
      const redirect = searchParams.get("r");

      if (redirect) {
        navigate(decodeURIComponent(redirect), { replace: true });
      }

      fetchNotes();

      getOTPExpiry();
    } catch (err) {
      console.error(err);
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    if (selectedAlias) {
      fetchNotes(selectedAlias?.id);
    }
  }, [selectedAlias?.id]);

  return (
    <section className="page">
      <SharedHeader />

      {selectedNotes && selectedNotes.length > 0 && (
        <section className="w-full top_space py-5 mb-3">
          <div className="flex gap-4 flex-wrap">
            {selectedNotes.map((i, key) => (
              <SingleNote note={i} key={i.id} />
            ))}
          </div>
        </section>
      )}
      <Outlet />
    </section>
  );
};

export default Home;
