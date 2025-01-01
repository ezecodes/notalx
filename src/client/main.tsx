import "react-quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./index";
import { Provider } from "./hook";
import { createRoot } from "react-dom/client";
import ViewNote from "./ViewNote";
import NoteCreator from "./NoteCreator";
import NoteEditor from "./NoteEditor";
import CreateAlias from "./AliasCreator";
import AliasAuth from "./AliasAuth";
import Faq from "./Faq";
import { Slide, ToastContainer } from "react-toastify";

const route = createBrowserRouter([
  {
    path: "newnote",
    element: <NoteCreator />,
  },
  {
    path: "edit/:note_slug",
    element: <NoteEditor />,
  },
  {
    path: ":note_slug",
    element: <ViewNote />,
  },
  {
    path: "/",
    element: <Home />,
    children: [
      {
        path: "newalias",
        element: <CreateAlias />,
      },

      {
        path: "auth-with-alias",
        element: <AliasAuth />,
      },

      {
        path: "faq",
        element: <Faq />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <Provider>
    <RouterProvider router={route} />
    <ToastContainer
      position="top-right"
      autoClose={5126}
      hideProgressBar
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable={false}
      pauseOnHover
      theme="dark"
      transition={Slide}
    />
  </Provider>
);
