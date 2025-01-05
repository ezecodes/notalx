import { FC, useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { ScheduledTasksWrapper, SharedHeader, SingleNote } from "./component";
import { fetchAllScheduledTasksForAlias } from "./utils";
import { GlobalContext } from "./hook";
import { _IAlias, ApiFetchNote, ITask } from "../type";

const RenderNotes: FC<{ notes: ApiFetchNote[] }> = ({ notes }) => {
  return notes.map((i, key) => (
    <SingleNote collaborators={i.collaborators} note={i.note} key={i.note.id} />
  ));
};

const Notifications = () => {
  return <></>;
};

const Home = () => {
  const navigate = useNavigate();
  const { authAliasNotes, fetchAliasNotes, otpExpiry } =
    useContext(GlobalContext)!;
  const [searchParams] = useSearchParams();

  const [scheduledTasks, setScheduledTasks] = useState<
    { task: ITask; participants: _IAlias[] }[]
  >([]);

  const [currentPage, setCurrentPage] = useState("notes");

  useEffect(() => {
    try {
      const redirect = searchParams.get("r");
      const page = searchParams.get("page");
      if (redirect) {
        navigate(decodeURIComponent(redirect), { replace: true });
      }

      page && setCurrentPage(page);

      fetchAliasNotes();
      fetchAllScheduledTasksForAlias().then((res) => {
        res.status === "ok" && setScheduledTasks(res.data!.rows!);
      });
    } catch (err) {
      console.error(err);
    }
  }, [navigate, searchParams]);

  return (
    <section className="page">
      <SharedHeader />

      <div className="flex items-start top_space gap-x-3  w-full">
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
              to="?page=notification"
              className={`sub_button ${
                currentPage === "notification" ? "text-white" : "subtext"
              } `}
            >
              Notifications
            </Link>
          </>
        )}
      </div>

      {
        <section className="w-full top_space py-5 mb-3">
          <div className="flex gap-4 flex-wrap">
            {currentPage === "notes" && <RenderNotes notes={authAliasNotes} />}

            {currentPage === "tasks" && (
              <ScheduledTasksWrapper rows={scheduledTasks} />
            )}

            {currentPage === "notification" && <Notifications />}
          </div>
        </section>
      }
      <Outlet />
    </section>
  );
};

export default Home;
