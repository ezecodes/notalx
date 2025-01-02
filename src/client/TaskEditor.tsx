import { useEffect, useState } from "react";
import { DEFAULT_SCHEDULE_REMINDERS } from "../constants";
import { BackButton, Button, InputWithIcon } from "./component";
import { calculateReminderDate, calculateReminderLiteral } from "./utils";
import { IApiResponse, ISingleScheduledTask, ITask } from "../type";
import { useParams } from "react-router-dom";

const TaskEditor = () => {
  const [task, setTask] = useState<ITask | null>(null);
  const params = useParams<{ task_id: string }>();

  const fetchTask = async () => {
    const f = await fetch("/api/task/" + params.task_id);
    const response: IApiResponse<ITask> = await f.json();
    response.status === "ok" && setTask(response.data!);
  };

  const updateTask = async () => {
    const f = await fetch("/api/task/" + params.task_id, {
      method: "PUT",
      body: JSON.stringify(task?.task!),
      headers: {
        "content-type": "application/json",
      },
    });
    const response: IApiResponse<ITask> = await f.json();
    response.status === "ok" && setTask(response.data!);
  };

  useEffect(() => {
    fetchTask();
  }, []);

  const handleTaskEdit = (edit: Partial<ISingleScheduledTask>) => {
    let prev = task!.task;

    let newTask = { ...prev, ...edit };

    setTask({ ...task, task: newTask } as any);
  };

  return (
    <div
      className="modal top_space py-5"
      style={{ background: "#212121f7", backdropFilter: "blur(1px)" }}
    >
      <div className="sm:w-[400px]">
        <BackButton text="Edit Task Schedule" />
        <form className="flex flex-col items-end gap-y-7" onSubmit={updateTask}>
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
              value={task?.task!.name}
            />

            <div className="label_input">
              <label>Date & Time</label>
              <div className=" form_input">
                <input
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
                value={
                  calculateReminderLiteral(new Date(), task?.task!.reminder!)!
                }
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
            <Button onClick={() => {}} text="Save" />
          </div>
        </form>
      </div>
    </div>
  );
};
export default TaskEditor;
