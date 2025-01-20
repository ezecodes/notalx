import { FC, useEffect, useRef, useState } from "react";
import {
  IApiCollaborator,
  IApiResponse,
  ICollaboratorPermission,
  IUser,
  IUserPublic,
} from "../type";
import { BackButton, SearchDropdown } from "./component";
import { useParams, useSearchParams } from "react-router-dom";
import { decodeFromBase62 } from "./utils";
import { toast } from "react-toastify";

export const CollaboratorsModal = ({}) => {
  const [selected, setSelected] = useState<IUserPublic | null>(null);
  const params = useParams<{ note_slug: string }>();
  const parsedNoteId = useRef(decodeFromBase62(params.note_slug!));
  const [collaborators, setCollaborators] = useState<IApiCollaborator[]>([]);
  const hasCalled = useRef(false);
  const [searchParams] = useSearchParams();

  const noteOwnerId = useRef(searchParams.get("oid"));

  const parsedNoteOwnerId = useRef(
    noteOwnerId.current ? decodeFromBase62(noteOwnerId.current) : ""
  );

  async function getCollaborators() {
    const f = await fetch(`/api/note/${parsedNoteId.current}/collaborator`);
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      // setCollaborators((prev) => prev.filter((user) => user.id !== user_id));
      toast.success(response.message);
    }
  }

  async function deleteCollaborator(user_id: string) {
    const f = await fetch(`/api/note/${parsedNoteId}/collaborator/${user_id}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      setCollaborators((prev) => prev.filter((user) => user.id !== user_id));
      toast.success(response.message);
    }
  }

  async function saveCollaborator(
    user_id: string,
    permission: ICollaboratorPermission
  ) {
    const f = await fetch(`/api/note/${parsedNoteId}/collaborator`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ user_id, permission }),
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      toast.success(response.message);
      setTimeout(() => {}, 500);
    }
  }
  const handleCollabUpdate = (user: IUserPublic | null) => {
    setSelected(user);
  };

  useEffect(() => {
    if (!hasCalled.current) {
      getCollaborators();
      hasCalled.current = true;
    }
  }, []);

  return (
    <div className="modal top_space py-5" style={{ background: "#212121f7" }}>
      <div className="top_space sm:w-[450px] 3micro:w-[90%] w-full">
        <BackButton text="Manage note collaborators" />
        <br />
        <SearchDropdown
          label="Add Collaborators"
          filter={(option) => option.id !== noteOwnerId.current}
          selected={selected}
          onClick={handleCollabUpdate}
        />
        <div className="flex flex-col gap-y-2 pt-2 border_top mt-2">
          <span className="text-sm subtext">Exisiting collaborators</span>
          {collaborators.length > 0 ? (
            collaborators.map((i) => {
              return (
                <li className="dropdown_item relative">
                  {i["user.name"]}{" "}
                  {i.id === parsedNoteOwnerId.current ? " (You)" : ""}
                  <span
                    onClick={() => deleteCollaborator(i.id)}
                    className="absolute right-[5px] hidden text-sm"
                  >
                    Remove
                  </span>
                </li>
              );
            })
          ) : (
            <span className="flex items-center justify-center px-4 py-3">
              You haven't added a collaborator
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
export default CollaboratorsModal;
