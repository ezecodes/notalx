import { FC, useEffect, useState } from "react";
import { ImCancelCircle } from "react-icons/im";
import { INote } from "../type";
import { Link, useParams } from "react-router-dom";
import { fetchNote } from "./utils";

interface IViewNote {}
const ViewNote: FC<IViewNote> = () => {
  const params = useParams<{ note_slug: string }>();
  const [note, setNote] = useState<INote | null>(null);

  useEffect(() => {
    params.note_slug &&
      fetchNote(params.note_slug).then((res) => {
        if (res.status === "err") {
          alert(res.message);
          return;
        }

        res.data && setNote(res.data);
      });
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
