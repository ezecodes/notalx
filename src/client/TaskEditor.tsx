import { useContext, useEffect, useRef, useState } from "react";
import { BackButton, Button, InputWithIcon, SearchDropdown } from "./component";
import {
  calculateReminderDate,
  calculateReminderLiteral,
  decodeFromBase62,
  DEFAULT_SCHEDULE_REMINDERS,
} from "./utils";
import { _IAlias, IApiResponse, ITask } from "../type";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { GlobalContext } from "./hook";
import { MdDeleteOutline } from "react-icons/md";

const TaskEditor = () => {
  const { otpExpiry } = useContext(GlobalContext)!;
  const [task, setTask] = useState<ITask | null>(null);
  const params = useParams<{ task_id: string }>();
  const hasCalled = useRef(false);

  const [selectedParticipants, setSelectedParticipants] = useState<_IAlias[]>(
    []
  );
  const [selectedParticipant, setSelectedParticipant] =
    useState<_IAlias | null>(null);

  const fetchTask = async () => {
    const f = await fetch("/api/task/" + decodeFromBase62(params.task_id!));
    const response: IApiResponse<ITask> = await f.json();
    response.status === "ok" && setTask(response.data!);
  };

  const updateTask = async () => {
    const f = await fetch("/api/task/" + decodeFromBase62(params.task_id!), {
      method: "PUT",
      body: JSON.stringify({
        ...task!,
        participants: selectedParticipants,
      }),
      headers: {
        "content-type": "application/json",
      },
    });
    const response: IApiResponse<ITask> = await f.json();
    fetchTask();
    toast.info(response.message);
  };

  useEffect(() => {
    if (!hasCalled.current) {
      fetchTask();
      hasCalled.current = true;
    }
  }, []);

  const handleTaskEdit = (edit: Partial<ITask>) => {
    let prev = task!;

    let newTask = { ...prev, ...edit };

    setTask({ ...task, task: newTask } as any);
  };
  function handleParticipantUpdate(participant: _IAlias | null) {
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

  function handleParticipantDelete(alias_id: string) {
    if (selectedParticipant?.id === alias_id) {
      setSelectedParticipant(null);
    }
    setSelectedParticipants((prev) =>
      prev.filter((alias) => alias.id !== alias_id)
    );
  }

  async function sendRemove(alias_id: string) {}

  if (!task) return <></>;

  return (
    <div
      className="modal top_space py-8"
      style={{ background: "#212121f7", backdropFilter: "blur(1px)" }}
    >
      <div className="sm:w-[450px] w-[90%]">
        <BackButton text="Manage Task Schedule" />
        <form
          className="flex flex-col items-end gap-y-7"
          onSubmit={(e) => e.preventDefault()}
        >
          <div
            key={task!.id}
            className="flex p-3 rounded-md items-end bg-[#292929] flex-col w-full gap-y-3 "
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
                    handleTaskEdit({ date: new Date(e.target.value) });
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

            <div className="w-full label_input">
              <label>Participants</label>
              <SearchDropdown
                filter={(option) => option.id !== otpExpiry?.alias_id}
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
                {task.participants &&
                  task.participants.length > 0 &&
                  task.participants.map((i) => {
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
