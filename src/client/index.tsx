import { FC, useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import {
  BackButton,
  Button,
  InputWithIcon,
  NoteSkeleton,
  RingsLoader,
  ScheduledTasksWrapper,
  SharedHeader,
  SingleNote,
} from "./component";

import { GlobalContext } from "./hook";
import { _IUser, ApiFetchNote, INote, IPaginatedResponse } from "../type";
import { LiaSearchSolid } from "react-icons/lia";
import { IoMdSend } from "react-icons/io";
import { toast } from "react-toastify";

type INoteCategoryRes = {
  id: string;
  category_name: string;
  tags: string[];
};

const Home = () => {
  const navigate = useNavigate();
  const {
    authUserNotes,
    fetchUserNotes,
    notesSharedWithUser,
    fetchNotesSharedWithUser,
    otpExpiry,
    scheduledTasks,
  } = useContext(GlobalContext)!;
  const [searchParams] = useSearchParams();
  const [showSearchModal, setSearchModal] = useState(false);
  const hasCalled = useRef(false);

  const [noteCategories, setNoteCategories] = useState<INoteCategoryRes[]>([]);

  const [currentPage, setCurrentPage] = useState("notes");
  const [currentNoteTab, setCurrentNoteTab] = useState("owned");

  const fetchAllNoteCategories = async () => {
    const f = await fetch("/api/note/category");
    const response: IPaginatedResponse<INoteCategoryRes> = await f.json();

    response.status === "ok" && setNoteCategories(response.data!.rows);
  };

  useEffect(() => {
    try {
      const redirect = searchParams.get("r");
      const page = searchParams.get("page");
      const modal = searchParams.get("modal");
      if (redirect) {
        navigate(decodeURIComponent(redirect), { replace: true });
      }

      if (modal && modal === "search") {
        setSearchModal(true);
      } else {
        setSearchModal(false);
      }

      page && setCurrentPage(page);

      fetchUserNotes();

      // fetchNotesSharedWithUser();
      // fetchAllNoteCategories();
    } catch (err) {
      console.error(err);
    }
  }, [navigate, searchParams]);

  const handleCurrentNoteTab = (value: string) => {
    if (currentNoteTab === "none" || value !== currentNoteTab)
      setCurrentNoteTab(value);
    if (currentNoteTab === value) setCurrentNoteTab("none");
  };

  return (
    <section className="page">
      <SharedHeader />
      <SearchModal isOpen={showSearchModal} />

      {/* <div className="flex items-start gap-x-3  w-full">
        {otpExpiry?.is_valid_auth && (
          <>
            <Link
              to="?page=notes"
              className={`sub_button ${
                currentPage === "notes" ? "text-white" : "subtext"
              } `}
            >
              Notes
            </Link>
            <Link
              to="?page=tasks"
              className={`sub_button ${
                currentPage === "tasks" ? "text-white" : "subtext"
              } `}
            >
              Schedules
            </Link>{" "}
          </>
        )}
      </div> */}

      {otpExpiry && otpExpiry.is_valid_auth && (
        <section className="w-full py-5 mb-3">
          <div className="flex gap-4 flex-wrap">
            {currentPage === "notes" && (
              <RenderNotes
                noteCategories={noteCategories}
                currentNoteTab={currentNoteTab}
                setCurrentNoteTab={handleCurrentNoteTab}
                sharedNotes={notesSharedWithUser}
                ownedNotes={authUserNotes}
              />
            )}

            {currentPage === "tasks" && (
              <ScheduledTasksWrapper rows={scheduledTasks} />
            )}
          </div>
        </section>
      )}
      <Outlet />
    </section>
  );
};

const SmallButton: FC<{
  active: boolean;
  listener: () => void;
  text: string;
}> = ({ active, listener, text }) => {
  return (
    <button
      className="sp_buttons"
      style={active ? { backgroundColor: "#3a3a43" } : {}}
      onClick={listener}
    >
      {text}
    </button>
  );
};
const CategoryButton: FC<{
  current: string;
  category: string;
  click: (value: string) => void;
}> = ({ click, category, current }) => {
  return (
    <button
      style={{ height: "20px" }}
      onClick={() => click(category)}
      className={`text-sm ${current === category ? "text-white" : "subtext"}`}
    >
      {category} <span className="noti"> {} </span>
    </button>
  );
};
const RenderNotes: FC<{
  sharedNotes: ApiFetchNote[];
  ownedNotes: ApiFetchNote[];
  currentNoteTab: string;
  noteCategories: INoteCategoryRes[];
  setCurrentNoteTab: (tab: string) => void;
}> = ({
  sharedNotes,
  ownedNotes,
  currentNoteTab,
  setCurrentNoteTab,
  noteCategories,
}) => {
  const [currentCategory, setCurrentCategory] = useState("none");

  const handleCategoryClick = (value: string) => {
    if (currentCategory === "none" || value !== currentCategory)
      setCurrentCategory(value);
    if (currentCategory === value) setCurrentCategory("none");
  };
  const [showIcon, setIcon] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full gap-y-4">
      <div className="flex items-center flex-wrap gap-y-3 flex-y-4 gap-x-3">
        <SmallButton
          text="Created By Me"
          active={currentNoteTab === "owned"}
          listener={() => setCurrentNoteTab("owned")}
        />
        <SmallButton
          text="Shared With Me"
          active={currentNoteTab === "shared"}
          listener={() => setCurrentNoteTab("shared")}
        />
        <Button onClick={() => navigate("?modal=search")} text="AI Search" />
      </div>

      <div className="flex gap-x-3 flex-wrap gap-y-5">
        {noteCategories.map((i) => (
          <CategoryButton
            click={handleCategoryClick}
            current={currentCategory}
            category={i.category_name!}
          />
        ))}
      </div>
      <div className="grid_wrap">
        {currentNoteTab === "owned" &&
          ownedNotes.map((i, key) =>
            currentCategory === "none" ||
            i.note.category_name === currentCategory ? (
              <SingleNote
                type="note"
                collaborators={i.collaborators}
                note={i.note}
                key={i.note.id}
              />
            ) : (
              <></>
            )
          )}

        {currentNoteTab === "shared" &&
          sharedNotes.map((i, key) =>
            currentCategory === "none" ||
            i.note.category_name === currentCategory ? (
              <SingleNote
                type="note"
                collaborators={i.collaborators}
                note={i.note}
                key={i.note.id}
              />
            ) : (
              <></>
            )
          )}
      </div>
    </div>
  );
};

const SearchModal: FC<{
  isOpen: boolean;
  setOpen?: (value: boolean) => void;
}> = ({ isOpen, setOpen }) => {
  const {
    lastSearchValue,
    searchValue,
    searchResults,
    searchLoading,
    beginSearch,
    setSearchValue,
  } = useContext(GlobalContext)!;

  if (!isOpen) return <></>;
  return (
    <div className="modal">
      <div className=" flex flex-col gap-y-4 w-full">
        <BackButton text="Back" url={-1} />
        <div
          className={`animate__animated animate__fadeIn mx-[auto] 3micro:w-[350px]`}
        >
          <InputWithIcon
            endIcon={
              searchLoading ? (
                <RingsLoader />
              ) : (
                <IoMdSend className="subtext" onClick={beginSearch} />
              )
            }
            onChange={(value) => {
              setSearchValue(value);
            }}
            value={searchValue}
            placeholder="e.g Search with natural words"
            type="text"
            name="Notes"
          />
        </div>
        <div className="flex gap-y-4 flex-col">
          {lastSearchValue && (
            <h5 className="font-[500]">
              Top hits:{" "}
              <span style={{ fontStyle: "italic" }}> {lastSearchValue}</span>
            </h5>
          )}
          <div className="grid_wrap">
            {searchLoading ? (
              <NoteSkeleton />
            ) : (
              searchResults.map((note) => {
                return (
                  <SingleNote
                    note={note.note}
                    collaborators={note.collaborators}
                    type="note"
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
