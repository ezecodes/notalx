import "react-quill/dist/quill.snow.css";
import "choices.js/public/assets/styles/choices.min.css";
import "react-toastify/dist/ReactToastify.css";

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./index";
import { Provider } from "./hook";
import { createRoot } from "react-dom/client";
import ViewNote from "./ViewNote";
import Editor from "./NoteEditor";

const route = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children: [
      {
        path: "/edit",
        element: <Editor />,
      },
      {
        path: "/:note_slug",
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
