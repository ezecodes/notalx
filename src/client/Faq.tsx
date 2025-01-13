import { ImInfo } from "react-icons/im";
import { Link } from "react-router-dom";
import { Button } from "./component";

const Faq = () => {
  return (
    <div className="modal animate__animated animate__slideInDown">
      <div
        style={{ border: "1px solid #535353" }}
        className="flex mt-7 flex-col gap-y-3 relative modal_child shadow-md px-5 py-5 rounded-md"
      >
        <h3 className="text-[1.1rem] font-[500]">Saving your note</h3>
        <div className="flex items-start gap-x-3 ">
          <ImInfo />
          <div className="text-gray-300 text-sm space-y-2">
            <p>
              To save your note, you need to choose an alias. If an alias is not
              available, you can create a new one{" "}
              <Link
                className="text-blue-200 underline"
                target="_blank"
                to={"/newalias"}
              >
                here
              </Link>
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Alias Requirement:</strong> An alias is a unique
                identifier for your note. Without it, your note cannot be saved.
              </li>
              <li>
                <strong>Hidden Notes:</strong> To mark a note as hidden, you
                must provide a secret. This ensures the note remains secure and
                accessible only to those with the secret.
              </li>
              <li>
                <strong>Self-Destruct Notes:</strong> For notes that
                self-destruct, you are required to set a timer. This timer
                determines when the note will be permanently deleted from the
                system. Examples of valid timers: <code>2 seconds</code>,{" "}
                <code>5 minutes</code>, <code>3 hours</code>,{" "}
                <code>2 days</code>.
              </li>
            </ul>
            <p>
              Ensure you carefully set these options to manage your notes
              effectively. Missing any of these requirements may prevent your
              note from being saved or functioning as expected.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button text="Dismis" onClick={() => history.back()} />
        </div>
      </div>
    </div>
  );
};

export default Faq;
