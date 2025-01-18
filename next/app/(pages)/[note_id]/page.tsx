"use client";

import { FC, useContext, useEffect, useRef, useState } from "react";
import { decodeFromBase62, encodeToBase62, fetchNote } from "../../_utils";
import { GlobalContext } from "../../_hooks/hook";
import {
  BackButton,
  Button,
  DisplayDateCreated,
  ExpirationInfo,
} from "../../_components/shared";
import { toast } from "react-toastify";
import { _IUser, INote } from "../../../../server/type";
import { useRouter } from "next/router";

export default function ViewNote({ params, searchParams }: PageParams) {
  const router = useRouter();
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

  function handleNoteFetch() {
    fetchNote(decodeFromBase62(params.note_id) as string).then((res) => {
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
      onDoubleClick={() => router.push("/note/" + encodeToBase62(note.note.id))}
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
                    router.push("/note/" + encodeToBase62(note.note.id))
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
}
type PageParams = {
  params: {
    note_id: string;
  };
  searchParams: {};
};
