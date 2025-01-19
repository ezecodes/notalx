import { FC, useContext, useEffect, useRef, useState } from "react";
import { _IUser, INote } from "../type";
import { useNavigate, useParams } from "react-router-dom";
import { decodeFromBase62, encodeToBase62, fetchNote } from "./utils";
import { GlobalContext } from "./hook";
import {
  BackButton,
  Button,
  DisplayDateCreated,
  ExpirationInfo,
} from "./component";
import { toast } from "react-toastify";

interface IViewNote {}
const ViewNote: FC<IViewNote> = () => {
  const params = useParams<{ note_slug: string }>();
  const [note, setNote] = useState<{
    note: INote;
    collaborators: _IUser[];
  } | null>(null);
  const hasCalled = useRef(false);
  const {
    Is_Authorised_User_Same_As_Note_User,
    getOTPExpiry,
    deleteNote,
    Is_Authorised_User_A_Note_Collaborator,
  } = useContext(GlobalContext)!;

  const navigate = useNavigate();

  function handleNoteFetch() {
    const slug = params.note_slug ? decodeFromBase62(params.note_slug) : null;
    fetchNote(slug as string).then((res) => {
      if (res.status === "err") {
        toast.error(res.message);
        return;
      }

      res.data && setNote(res.data);
    });
  }

  useEffect(() => {
    if (!hasCalled.current) {
      getOTPExpiry();
      handleNoteFetch();

      hasCalled.current = true;
    }
  }, []);

  if (!note) return <></>;

  return (
    <div
      className="modal note_manager  relative animate__animated animate__fadeIn"
      onDoubleClick={() => navigate("/note/" + encodeToBase62(note.note.id))}
    >
      <div className="flex modal_child flex-col gap-y-3 ">
        <BackButton text={note.note.title} url={"/"} />

        <div
          className="note_body ql-container ql-snow quill ql-editor"
          dangerouslySetInnerHTML={{ __html: note.note.content }}
        ></div>

        <div className="flex flex-col gap-y-3 pt-2 mt-2 items-end border_top">
          <div className="flex text-md gap-x-3 gap-y-3 flex-wrap items-center  justify-end ">
            <ExpirationInfo time={note.note.self_destroy_time} />
            <DisplayDateCreated date={note.note.createdAt} />
          </div>

          <div className="flex text-md gap-x-3 gap-y-3 pt-4 justify-end ">
            {Is_Authorised_User_Same_As_Note_User(note.note.owner_id) ||
            Is_Authorised_User_A_Note_Collaborator(note.collaborators) ? (
              <>
                <Button
                  text="Delete"
                  onClick={() => deleteNote(note.note.id)}
                />
                <Button
                  text="Edit"
                  onClick={() =>
                    navigate("/note/" + encodeToBase62(note.note.id))
                  }
                />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewNote;
