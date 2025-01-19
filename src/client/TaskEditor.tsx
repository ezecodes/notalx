import { useContext, useEffect, useRef, useState } from "react";
import { BackButton, Button, InputWithIcon, SearchDropdown } from "./component";
import {
  calculateReminderDate,
  calculateReminderLiteral,
  decodeFromBase62,
  DEFAULT_SCHEDULE_REMINDERS,
} from "./utils";
import { _IUser, IApiResponse, ITask } from "../type";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { GlobalContext } from "./hook";
import { MdDeleteOutline } from "react-icons/md";

const TaskEditor = () => {
  const { otpExpiry } = useContext(GlobalContext)!;
  const [task, setTask] = useState<ITask | null>(null);
  const [taskParticipants, setTaskParticipants] = useState<_IUser[]>([]);
  const params = useParams<{ task_id: string }>();
  const hasCalled = useRef(false);
  const parsedTaskId = useRef(decodeFromBase62(params.task_id!));

  const [selectedParticipants, setSelectedParticipants] = useState<_IUser[]>(
    []
  );
  const [selectedParticipant, setSelectedParticipant] = useState<_IUser | null>(
    null
  );

  const fetchTask = async () => {
    const f = await fetch("/api/task/" + parsedTaskId.current!);
    const response: IApiResponse<{ task: ITask; participants: _IUser[] }> =
      await f.json();
    if (response.status === "ok") {
      setSelectedParticipants([]);
      setTaskParticipants(response.data!.participants!);
      setTask(response.data?.task!);
    }
  };

  const updateTask = async () => {
    const body = task as any;
    if (selectedParticipants.length > 0) {
      body.participants = selectedParticipants;
    }
    const f = await fetch("/api/task/" + parsedTaskId.current!, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
    });
    const response: IApiResponse<ITask> = await f.json();
    if (response.status === "ok") {
      toast.success(response.message);
      fetchTask();
    } else {
      toast.error(response.message);
    }
  };

  useEffect(() => {
    if (!hasCalled.current) {
      fetchTask();
      hasCalled.current = true;
    }
  }, []);
  async function sendRemove(user_id: string) {
    const f = await fetch(`/api/task/${parsedTaskId.current!}/participants`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ task_id: parsedTaskId.current, user_id }),
    });
    const response: IApiResponse<null> = await f.json();
    if (response.status === "err") toast.error(response.message);
    else {
      setTaskParticipants((prev) => prev.filter((user) => user.id !== user_id));
      toast.success(response.message);
    }
  }
  const handleTaskEdit = (edit: Partial<ITask>) => {
    let prev = task!;

    setTask({ ...prev, ...edit } as any);
  };
  function handleParticipantUpdate(participant: _IUser | null) {
    setSelectedParticipant(participant);
    if (!participant) return;
    let items = selectedParticipants;
    if (!items) {
      items = [participant];
      setSelectedParticipants(items);
    } else {
      if (items.find((i) => i.id === participant.id)) return;
      items.push(participant);
      setSelectedParticipants(items);
    }
  }

  function handleParticipantDelete(user_id: string) {
    if (selectedParticipant?.id === user_id) {
      setSelectedParticipant(null);
    }
    setSelectedParticipants((prev) =>
      prev.filter((user) => user.id !== user_id)
    );
  }

  if (!task) return <></>;

  return (
    <div
      className="modal top_space py-8"
      style={{ background: "#212121f7", backdropFilter: "blur(1px)" }}
    >
      <div className="sm:w-[450px] 3micro:w-[90%] w-full">
        <BackButton text="Manage Task Schedule" />
        <form
          className="flex flex-col items-end gap-y-7"
          onSubmit={(e) => e.preventDefault()}
        >
          <div
            key={task!.id}
            className="flex p-3 rounded-md items-end flex-col w-full gap-y-3 "
          >
            <InputWithIcon
              placeholder="Task name"
              label="Task name"
              onChange={(value) => {
                handleTaskEdit({ name: value });
              }}
              type="text"
              value={task.name}
            />

            <div className="label_input">
              <label>Date & Time</label>
              <div className=" form_input">
                <input
                  onChange={(e) => {
                    handleTaskEdit({
                      date: new Date(e.target.value).toISOString() as any,
                    });
                  }}
                  value={new Date(task.date).toISOString().slice(0, 16)}
                  type="datetime-local"
                  className="ml-2 w-full border bg-transparent placeholder-gray-400  "
                />
              </div>
            </div>

            <div className="label_input ">
              <label>Reminder</label>
              <select
                onChange={(e) => {
                  const dateTime = calculateReminderDate(
                    new Date(),
                    e.target.value
                  );
                  handleTaskEdit({
                    reminder: dateTime!,
                  });
                }}
                name="choice"
                value={calculateReminderLiteral(new Date(), task!.reminder!)!}
                className="bg-[#333] py-4 px-4 w-full rounded-md flex items-center justify-start"
              >
                <option value={DEFAULT_SCHEDULE_REMINDERS[0]}>
                  {DEFAULT_SCHEDULE_REMINDERS[0]}
                </option>
                ;
                {DEFAULT_SCHEDULE_REMINDERS.map((option) => {
                  return <option value={option}>{option}</option>;
                })}
              </select>
            </div>

            <div className="label_input">
              <label className="subtext">Duration for task</label>
              <InputWithIcon
                placeholder="e.g 2 seconds"
                type="text"
                value={task.duration}
                onChange={(value) => handleTaskEdit({ duration: value })}
              />
            </div>

            <div className="w-full label_input">
              <SearchDropdown
                label="Add Participants"
                filter={(option) => option.id !== otpExpiry?.user_id}
                selected={selectedParticipant}
                onClick={handleParticipantUpdate}
              />

              <div className="flex w-full flex-col gap-y-2 pt-2 ">
                {selectedParticipants.length > 0 &&
                  selectedParticipants.map((i) => {
                    return (
                      <li className="dropdown_item duration-100 w-full relative">
                        {i.name}
                        <MdDeleteOutline
                          onClick={() => handleParticipantDelete(i.id)}
                          className="delete_ico absolute right-[5px]"
                        />
                      </li>
                    );
                  })}
              </div>
              <div className="flex w-full flex-col gap-y-2 pt-2 border_top mt-2">
                <span className="text-sm subtext">Exisiting Participants</span>
                {taskParticipants &&
                  taskParticipants.length > 0 &&
                  taskParticipants.map((i) => {
                    return (
                      <li className="dropdown_item w-full relative">
                        {i.name}
                        <span
                          onClick={() => sendRemove(i.id)}
                          className="absolute right-[5px] hidden text-sm"
                        >
                          Remove
                        </span>
                      </li>
                    );
                  })}
              </div>
            </div>

            <Button onClick={updateTask} text="Save" />
          </div>
        </form>
      </div>
    </div>
  );
};
export default TaskEditor;
