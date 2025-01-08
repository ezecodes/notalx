import { FC, useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import {
  ScheduledTasksWrapper,
  SharedHeader,
  SingleNote,
  SingleTemplate,
} from "./component";

import { GlobalContext } from "./hook";
import {
  _IAlias,
  ApiFetchNote,
  ICategory,
  IPaginatedResponse,
  ITemplate,
} from "../type";
import { CiGrid41 } from "react-icons/ci";

const Home = () => {
  const navigate = useNavigate();
  const {
    authAliasNotes,
    fetchAliasNotes,
    notesSharedWithAlias,
    fetchNotesSharedWithAlias,
    otpExpiry,
    scheduledTasks,
  } = useContext(GlobalContext)!;
  const [searchParams] = useSearchParams();

  const [templates, setTemplates] = useState<ITemplate[]>([]);

  const [currentPage, setCurrentPage] = useState("notes");
  const [currentNoteTab, setCurrentNoteTab] = useState("owned");

  const fetchTemplates = async () => {
    const f = await fetch("/api/template");
    const response: IPaginatedResponse<ITemplate> = await f.json();

    response.status === "ok" && setTemplates(response.data!.rows);
  };

  useEffect(() => {
    try {
      const redirect = searchParams.get("r");
      const page = searchParams.get("page");
      if (redirect) {
        navigate(decodeURIComponent(redirect), { replace: true });
      }

      page && setCurrentPage(page);

      fetchAliasNotes();

      fetchNotesSharedWithAlias();
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  }, [navigate, searchParams]);

  return (
    <section className="page">
      <SharedHeader />

      <div className="flex items-start gap-x-3  w-full">
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
            <Link
              to="?page=templates"
              className={`sub_button ${
                currentPage === "templates" ? "text-white" : "subtext"
              } `}
            >
              Templates
            </Link>
          </>
        )}
      </div>

      {otpExpiry && otpExpiry.is_valid_auth && (
        <section className="w-full py-5 mb-3">
          <div className="flex gap-4 flex-wrap">
            {currentPage === "notes" && (
              <RenderNotes
                currentNoteTab={currentNoteTab}
                setCurrentNoteTab={(tab) => setCurrentNoteTab(tab)}
                sharedNotes={notesSharedWithAlias}
                ownedNotes={authAliasNotes}
              />
            )}

            {currentPage === "tasks" && (
              <ScheduledTasksWrapper rows={scheduledTasks} />
            )}

            {currentPage === "templates" && (
              <RenderTemplates templates={templates} />
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
const RenderNotes: FC<{
  sharedNotes: ApiFetchNote[];
  ownedNotes: ApiFetchNote[];
  currentNoteTab: string;
  setCurrentNoteTab: (tab: string) => void;
}> = ({ sharedNotes, ownedNotes, currentNoteTab, setCurrentNoteTab }) => {
  return (
    <div className="flex flex-col w-full gap-y-4">
      <div className="flex items-center gap-x-3">
        <CiGrid41 className="text-lg" />
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
      </div>
      <div className="grid_wrap">
        {currentNoteTab === "owned" &&
          ownedNotes.map((i, key) => (
            <SingleNote
              type="note"
              collaborators={i.collaborators}
              note={i.note}
              key={i.note.id}
            />
          ))}

        {currentNoteTab === "shared" &&
          sharedNotes.map((i, key) => (
            <SingleNote
              type="note"
              collaborators={i.collaborators}
              note={i.note}
              key={i.note.id}
            />
          ))}
      </div>
    </div>
  );
};

const RenderTemplates: FC<{ templates: ITemplate[] }> = ({ templates }) => {
  const [categories, setCategories] = useState<ICategory[]>([]);

  const fechCategories = async () => {
    const f = await fetch("/api/category");
    const response: IPaginatedResponse<ICategory> = await f.json();

    response.status === "ok" && setCategories(response.data!.rows);
  };
  useEffect(() => {
    fechCategories();
  }, []);
  return (
    <section>
      <div className="flex flex-col w-full gap-y-4">
        <div className="flex items-center gap-x-3">
          {categories.map((category) => (
            <SmallButton
              text={category.name}
              active={false}
              listener={() => {}}
              key={category.id}
            />
          ))}
        </div>
        <div className="grid_wrap">
          {templates &&
            templates.map((template, key) => (
              <SingleTemplate template={template} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Home;
