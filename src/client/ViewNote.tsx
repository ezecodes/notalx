import { FC, useContext, useEffect, useRef, useState } from "react";
import { ImCancelCircle } from "react-icons/im";
import { ErrorCodes, INote } from "../type";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchNote, isSessionExpired } from "./utils";
import { GlobalContext } from "./hook";
import { MdDeleteOutline } from "react-icons/md";
import { IoCreateOutline } from "react-icons/io5";

interface IViewNote {}
const ViewNote: FC<IViewNote> = () => {
  const params = useParams<{ note_slug: string }>();
  const [note, setNote] = useState<INote | null>(null);
  const retries = useRef(0);
  const hasCalled = useRef(false);
  const { otpExpiry, getOTPExpiry, deleteNote } = useContext(GlobalContext)!;

  const navigate = useNavigate();

  function handleNoteFetch(slug: string, secret?: string) {
    if (retries.current === 2) return;
    fetchNote(slug, secret as string).then((res) => {
      retries.current = retries.current + 1;
      if (res.status === "err") {
        if (res.error_code === ErrorCodes.UNAUTHORIZED) {
          const handler = prompt("Note is locked. Enter secret to proceed:");
          handleNoteFetch(slug, handler as string);
        } else {
          alert(res.message);
        }
      }

      res.data && setNote(res.data);
    });
  }

  useEffect(() => {
    params.note_slug && handleNoteFetch(params.note_slug);
    if (!hasCalled.current) {
      getOTPExpiry();

      hasCalled.current = true;
    }
  }, []);

  if (!note) return <></>;

  return (
    <div className="modal px-5 relative animate__animated animate__slideInDown">
      <div className="flex modal_child mt-7 flex-col gap-y-3  relative  px-5 py-5 rounded-md">
        <Link to={"/"} className="absolute right-[10px]">
          <ImCancelCircle />
        </Link>
        <h4 className="font-[500] text-[1.1rem]">{note.title}</h4>
        <div dangerouslySetInnerHTML={{ __html: note.content }}></div>

        <div className="flex justify-end border_top">
          {otpExpiry && !isSessionExpired(otpExpiry.expiry) ? (
            <>
              <MdDeleteOutline onClick={() => deleteNote(note.id)} />
              <IoCreateOutline onClick={() => navigate("/edit/" + note.slug)} />
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewNote;
