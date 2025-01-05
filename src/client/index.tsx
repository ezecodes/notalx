import { FC, useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  ScheduledTasksWrapper,
  SharedHeader,
  SingleNote,
} from "./component";
import {
  encodeToBase62,
  fetchAllScheduledTasksForAlias,
  formatRelativeTime,
} from "./utils";
import { GlobalContext } from "./hook";
import {
  _IAlias,
  ApiFetchNote,
  INotification,
  IPaginatedResponse,
  ITask,
  NotificationType,
} from "../type";

const Home = () => {
  const navigate = useNavigate();
  const {
    authAliasNotes,
    fetchAliasNotes,
    notesSharedWithAlias,
    fetchNotesSharedWithAlias,
    otpExpiry,
  } = useContext(GlobalContext)!;
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
      fetchNotesSharedWithAlias();
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
            {currentPage === "notes" && (
              <RenderNotes
                sharedNotes={notesSharedWithAlias}
                ownedNotes={authAliasNotes}
              />
            )}

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
}> = ({ sharedNotes, ownedNotes }) => {
  const [currentTab, setCurrentTab] = useState<"shared" | "owned">("owned");

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-3">
        <SmallButton
          text="Created By Me"
          active={currentTab === "owned"}
          listener={() => setCurrentTab("owned")}
        />
        <SmallButton
          text="Shared With Me"
          active={currentTab === "shared"}
          listener={() => setCurrentTab("shared")}
        />
      </div>
      {currentTab === "owned" &&
        ownedNotes.map((i, key) => (
          <SingleNote
            collaborators={i.collaborators}
            note={i.note}
            key={i.note.id}
          />
        ))}

      {currentTab === "shared" &&
        sharedNotes.map((i, key) => (
          <SingleNote
            collaborators={i.collaborators}
            note={i.note}
            key={i.note.id}
          />
        ))}
    </div>
  );
};

const Notifications = ({}) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const fetchNotifications = async () => {
    const f = await fetch("/api/notification");
    const res: IPaginatedResponse<INotification> = await f.json();
    if (res.status === "ok") setNotifications(res.data?.rows!);
  };

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);
  return (
    <div className="flex flex-col gap-y-4">
      {notifications.map((notification) => {
        return (
          <div className="flex w-[450px] bg-[#333] py-3 gap-y-3 px-5 flex-col">
            <div className=" flex flex-col gap-y-1 rounded-sm ">
              <h6 className="font-[500] text-md ">
                {notification.title}
                {"  "}
                <span className="text-sm text-[#bbb] font-[300]">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </h6>
              <span className="text-sm subtetx">{notification.message}</span>
            </div>
            <div>
              {notification.type === NotificationType.AddedCollaborator && (
                <Button
                  text="View Note"
                  onClick={() =>
                    navigate(
                      `/${encodeToBase62(notification.metadata.note_id)}`
                    )
                  }
                />
              )}{" "}
              {notification.type === NotificationType.AddedParticipant && (
                <Button
                  text="View Task"
                  onClick={() =>
                    navigate(
                      `/task/${encodeToBase62(notification.metadata.task_id)}`
                    )
                  }
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default Home;
