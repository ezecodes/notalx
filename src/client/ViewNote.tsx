import { FC, useEffect, useState } from "react";
import { ImCancelCircle } from "react-icons/im";
import { INote } from "../type";
import { useParams } from "react-router-dom";
import { fetchNote } from "./utils";

interface IViewNote {}
const ViewNote: FC<IViewNote> = () => {
  const params = useParams<{ note_id: string }>();
  const [note, setNote] = useState<INote | null>(null);

  useEffect(() => {
    params.note_id &&
      fetchNote(params.note_id).then((res) => {
        res.data && setNote(res.data);
      });
  }, []);

  if (!note) return <></>;

  return (
    <div className="modal px-5 relative animate__animated animate__slideInDown">
      <div
        className="flex mt-7 flex-col gap-y-3 sm:w-[600px] md:w-[700px]  relative  shadow-md px-5 py-5 rounded-md"
        style={{
          border: "1px solid #555555",
        }}
      >
        <div className="absolute right-[10px]">
          <ImCancelCircle onClick={() => history.back()} />
        </div>
        <h4 className="font-[500] text-[1.1rem]">{note.title}</h4>
        <div dangerouslySetInnerHTML={{ __html: note.content }}></div>
      </div>
    </div>
  );
};

export default ViewNote;
