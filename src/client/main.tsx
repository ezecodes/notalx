import "react-quill/dist/quill.snow.css";
import "choices.js/public/assets/styles/choices.min.css";
import "react-toastify/dist/ReactToastify.css";

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./index";
import { Provider } from "./hook";
import { createRoot } from "react-dom/client";
import ViewNote from "./ViewNote";
import Editor from "./NoteEditor";
import CreateAlias from "./AliasCreator";
import AliasAuth from "./AliasAuth";

const route = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children: [
      {
        path: "newnote",
        element: <Editor />,
      },
      {
        path: "newalias",
        element: <CreateAlias />,
      },
      {
        path: "auth-with-alias",
        element: <AliasAuth />,
      },
      {
        path: ":note_slug",
        element: <ViewNote />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <Provider>
    <RouterProvider router={route} />
  </Provider>
);
