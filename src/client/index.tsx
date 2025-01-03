import { FC, useContext, useEffect, useState } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { ScheduledTasksWrapper, SharedHeader, SingleNote } from "./component";
import { fetchAllScheduledTasksForAlias } from "./utils";
import { GlobalContext } from "./hook";
import { _IAlias, ApiFetchNote, ITask } from "../type";
type Tab = "notes" | "tasks" | "public";

const RenderNotes: FC<{ notes: ApiFetchNote[] }> = ({ notes }) => {
  return notes.map((i, key) => (
    <SingleNote collaborators={i.collaborators} note={i.note} key={i.note.id} />
  ));
};

const Home = () => {
  const navigate = useNavigate();
  const {
    getOTPExpiry,
    fetchNotes,
    publicNotes,
    authAliasNotes,
    fetchAliasNotes,
    otpExpiry,
  } = useContext(GlobalContext)!;
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    otpExpiry?.is_valid_auth ? "notes" : "public"
  );
  const [scheduledTasks, setScheduledTasks] = useState<
    { task: ITask; participants: _IAlias[] }[]
  >([]);

  useEffect(() => {
    try {
      const redirect = searchParams.get("r");

      if (redirect) {
        navigate(decodeURIComponent(redirect), { replace: true });
      }

      fetchNotes();
      fetchAliasNotes();
      fetchAllScheduledTasksForAlias().then((res) => {
        res.status === "ok" && setScheduledTasks(res.data!.rows!);
      });

      getOTPExpiry();
    } catch (err) {
      console.error(err);
    }
  }, [navigate, searchParams]);

  return (
    <section className="page">
      <SharedHeader />

      <div className="flex items-start top_space gap-x-3  w-full">
        <button
          onClick={() => setActiveTab("public")}
          className={`sub_button ${
            activeTab === "public" ? "text-white" : "subtext"
          } `}
        >
          Public notes
        </button>

        {otpExpiry?.is_valid_auth && (
          <>
            <button
              onClick={() => setActiveTab("notes")}
              className={`sub_button ${
                activeTab === "notes" ? "text-white" : "subtext"
              } `}
            >
              My notes
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`sub_button ${
                activeTab === "tasks" ? "text-white" : "subtext"
              } `}
            >
              Schedules
            </button>
          </>
        )}
      </div>

      {
        <section className="w-full top_space py-5 mb-3">
          <div className="flex gap-4 flex-wrap">
            {activeTab === "public" && <RenderNotes notes={publicNotes} />}
            {activeTab === "notes" && <RenderNotes notes={authAliasNotes} />}

            {activeTab === "tasks" && (
              <ScheduledTasksWrapper rows={scheduledTasks} />
            )}
          </div>
        </section>
      }
      <Outlet />
    </section>
  );
};

export default Home;
