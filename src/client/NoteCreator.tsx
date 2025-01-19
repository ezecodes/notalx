import { useEffect, useRef, useState } from "react";
import { IApiResponse, INote } from "../../type";
import { encodeToBase62 } from "./utils";
import { RingsLoader } from "./component";

const NoteCreator = () => {
  const hasCalled = useRef(false);
  const [loader, setLoader] = useState(true);

  const createNote = async () => {
    try {
      const f = await fetch("/api/note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const response: IApiResponse<INote> = await f.json();
      if (response.status === "ok") {
        document.location = "/note/" + encodeToBase62(response.data!.id);
      }
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (!hasCalled.current) {
      createNote();

      hasCalled.current = true;
    }
  }, []);

  if (loader) {
    return <RingsLoader />;
  }
  return <></>;
};
export default NoteCreator;
