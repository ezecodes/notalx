import { FC, useContext, useEffect, useRef, useState } from "react";
import { _IAlias, ErrorCodes, INote } from "../type";
import { useNavigate, useParams } from "react-router-dom";
import { decodeFromBase62, encodeToBase62, fetchNote } from "./utils";
import { GlobalContext } from "./hook";
import {
  BackButton,
  Button,
  DisplayDateCreated,
  ExpirationInfo,
  IsHiddenInfo,
} from "./component";
import { toast } from "react-toastify";

interface IViewNote {}
const ViewNote: FC<IViewNote> = () => {
  const params = useParams<{ note_slug: string }>();
  const [note, setNote] = useState<{
    note: INote;
    collaborators: _IAlias[];
  } | null>(null);
  const retries = useRef(0);
  const hasCalled = useRef(false);
  const {
    Is_Authorised_Alias_Same_As_Note_Alias,
    getOTPExpiry,
    deleteNote,
    Is_Authorised_Alias_A_Note_Collaborator,
  } = useContext(GlobalContext)!;

  const navigate = useNavigate();

  function handleNoteFetch(slug: string, secret?: string) {
    if (retries.current === 2) {
      document.location.href = "/";
    }
    fetchNote(slug, secret as string).then((res) => {
      retries.current = retries.current + 1;
      if (res.status === "err") {
        if (res.error_code === ErrorCodes.UNAUTHORIZED) {
          const handler = prompt("Note is locked. Enter secret to proceed:");
          handleNoteFetch(slug, handler as string);
        } else {
          toast(res.message);
        }
      }

      res.data && setNote(res.data);
    });
  }

  useEffect(() => {
    const slug = params.note_slug ? decodeFromBase62(params.note_slug) : null;
    slug && handleNoteFetch(slug);
    if (!hasCalled.current) {
      getOTPExpiry();

      hasCalled.current = true;
    }
  }, []);

  if (!note) return <></>;

  return (
    <div className="modal   relative animate__animated animate__slideInDown">
      <div className="flex modal_child flex-col gap-y-3 ">
        <BackButton text={note.note.title} url={-1} />

        <div
          className="note_body"
          dangerouslySetInnerHTML={{ __html: note.note.content }}
        ></div>

        <div className="flex flex-col gap-y-3 pt-2 mt-2 items-end border_top">
          <div className="flex text-md gap-x-3 gap-y-3 flex-wrap items-center  justify-end ">
            <ExpirationInfo
              time={note.note.self_destroy_time}
              willSelfDestroy={note.note.will_self_destroy}
            />
            <IsHiddenInfo hidden={note.note.is_hidden} />
            <DisplayDateCreated date={note.note.createdAt} />
          </div>

          <div className="flex text-md gap-x-3 gap-y-3 pt-4 justify-end ">
            {Is_Authorised_Alias_Same_As_Note_Alias(note.note.alias_id) ||
            Is_Authorised_Alias_A_Note_Collaborator(note.collaborators) ? (
              <>
                <Button
                  text="Delete"
                  onClick={() => deleteNote(note.note.id)}
                />
                <Button
                  text="Edit"
                  onClick={() =>
                    navigate("/edit/" + encodeToBase62(note.note.id))
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
