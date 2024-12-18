import { FC, useEffect, useRef, useState } from "react";
import { ImCancelCircle } from "react-icons/im";
import { ErrorCodes, INote } from "../type";
import { Link, useParams } from "react-router-dom";
import { fetchNote } from "./utils";

interface IViewNote {}
const ViewNote: FC<IViewNote> = () => {
  const params = useParams<{ note_slug: string }>();
  const [note, setNote] = useState<INote | null>(null);
  const retries = useRef(0);

  function handleNoteFetch(slug: string, secret?: string) {
    if (retries.current === 2) return;
    fetchNote(slug, secret as string).then((res) => {
      retries.current = retries.current + 1;
      if (res.status === "err") {
        if (res.error_code === ErrorCodes.UNAUTHORIZED) {
          const handler = prompt("Note is locked. Enter secret to proceed");
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
      </div>
    </div>
  );
};

export default ViewNote;
