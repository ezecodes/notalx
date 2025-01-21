import { FC, useEffect, useRef, useState } from "react";
import {
  IApiCollaborator,
  IApiResponse,
  ICollaboratorPermission,
  IPaginatedResponse,
  IUserPublic,
} from "../type";
import { BackButton, Button, SearchDropdown } from "./component";
import { useParams, useSearchParams } from "react-router-dom";
import { decodeFromBase62 } from "./utils";
import { toast } from "react-toastify";
import { MdDeleteForever, MdOutlineDelete } from "react-icons/md";
import { BiUniversalAccess } from "react-icons/bi";
import { BsArrowDown } from "react-icons/bs";

export const CollaboratorsModal = ({}) => {
  const [selected, setSelected] = useState<IUserPublic | null>(null);
  const params = useParams<{ note_slug: string }>();
  const parsedNoteId = useRef(decodeFromBase62(params.note_slug!));
  const [collaborators, setCollaborators] = useState<IApiCollaborator[]>([]);
  const hasCalled = useRef(false);
  const [searchParams] = useSearchParams();

  const noteOwnerId = useRef(searchParams.get("oid"));

  const [addedCollaborator, setAddedCollaborator] = useState<{
    id: string;
    name: string;
    read: boolean;
    write: boolean;
  } | null>(null);

  const parsedNoteOwnerId = useRef(
    noteOwnerId.current ? decodeFromBase62(noteOwnerId.current) : ""
  );

  async function getCollaborators() {
    const f = await fetch(`/api/note/${parsedNoteId.current}/collaborator`);
    const response: IPaginatedResponse<IApiCollaborator> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      setCollaborators(response.data!.rows!);
    }
  }

  async function deleteCollaborator(user_id: string) {
    const f = await fetch(
      `/api/note/${parsedNoteId.current}/collaborator/${user_id}`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
      }
    );
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      setTimeout(() => {
        getCollaborators();
      }, 500);
      toast.success(response.message);
    }
  }

  async function saveCollaborator(collaborator: IAddedCollaborator) {
    const f = await fetch(`/api/note/${parsedNoteId.current}/collaborator`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        user_id: collaborator?.id,
        permission: !collaborator?.write ? "read" : "write",
      }),
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      toast.success(response.message);
      setTimeout(() => {
        setAddedCollaborator(null);
        getCollaborators();
      }, 500);
    }
  }
  const handleCollabUpdate = (user: IUserPublic | null) => {
    setSelected(user);
    user &&
      setAddedCollaborator({
        id: user.id,
        name: user.name,
        read: true,
        write: false,
      });
  };

  function modifyWrite() {}

  const togglePermission = () => {};

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
          {addedCollaborator && (
            <>
              <span className="subtext">Added collaborator</span>
              <div className="flex flex-col gap-y-3">
                <li className="dropdown_item  relative">
                  {addedCollaborator.name}
                  <span
                    onClick={() => setAddedCollaborator(null)}
                    className="absolute right-[5px] text-sm"
                  >
                    Remove
                  </span>
                </li>
                <CollaboratorEdit
                  collaboratorToEdit={addedCollaborator}
                  onSave={(collaborator) => saveCollaborator(collaborator)}
                />
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col gap-y-2 pt-2 border_top mt-2">
          <span className="">Exisiting collaborators</span>
          {collaborators.length > 0 ? (
            collaborators.map((i) => {
              // const [show, setDisplay] = useState(false);
              return (
                <div className="flex flex-col gap-y-3 py-3 border_bottom">
                  <div className="dropdown_item bg-[#2f2f2f] relative">
                    {i["user.name"]}{" "}
                    {i.id === parsedNoteOwnerId.current ? " (You)" : ""}
                    <span
                      onClick={() => deleteCollaborator(i.user_id)}
                      className="absolute flex items-center gap-x-3 right-[5px] hidden text-sm"
                    >
                      <MdDeleteForever />
                    </span>
                  </div>
                  <CollaboratorEdit
                    collaboratorToEdit={{
                      id: i.user_id,
                      name: i["user.name"],
                      read: i.permission === "read",
                      write: i.permission === "write",
                    }}
                    onSave={(collaborator) => saveCollaborator(collaborator)}
                  />
                </div>
              );
            })
          ) : (
            <span className="flex items-center text-sm subtext justify-center px-4 py-3">
              You haven't added a collaborator
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
export default CollaboratorsModal;

type IAddedCollaborator = {
  id: string;
  name: string;
  read: boolean;
  write: boolean;
};
const CollaboratorEdit: FC<{
  collaboratorToEdit: IAddedCollaborator;
  onSave: (value: IAddedCollaborator) => void;
}> = ({ collaboratorToEdit, onSave }) => {
  const [modifedCollaborator, setCollaboratorModification] =
    useState<IAddedCollaborator>(collaboratorToEdit);

  return (
    <div className="flex flex-col text-sm subtext">
      Manage permission
      <ul className="flex items-center gap-x-3">
        <li className="flex gap-x-2 items-center">
          <input
            id={`read_${collaboratorToEdit.id}`}
            type="checkbox"
            checked={modifedCollaborator.read}
            onChange={(value) =>
              setCollaboratorModification((prev) => ({
                ...prev!,
                read: !prev!.read,
              }))
            }
          />{" "}
          <label
            htmlFor={`read_${collaboratorToEdit.id}`}
            className=" text-white"
          >
            Can view note
          </label>
        </li>
        <li className="flex gap-x-2 items-center">
          <input
            id={`write_${collaboratorToEdit.id}`}
            type="checkbox"
            checked={modifedCollaborator.write}
            onChange={(value) =>
              setCollaboratorModification((prev) => ({
                ...prev!,
                write: !prev!.write,
              }))
            }
          />{" "}
          <label
            htmlFor={`write_${collaboratorToEdit.id}`}
            className=" text-white"
          >
            Can view and edit note
          </label>
        </li>
      </ul>
      <div className="flex justify-end">
        <Button onClick={() => onSave(modifedCollaborator)} text="Save" />
      </div>
    </div>
  );
};
