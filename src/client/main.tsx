import "react-quill/dist/quill.snow.css";
import "choices.js/public/assets/styles/choices.min.css";
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
import AuthorisedAliasNotes from "./AuthorisedAliasNotes";

const route = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children: [
      {
        path: "newnote",
        element: <NoteCreator />,
      },
      {
        path: "newalias",
        element: <CreateAlias />,
      },

      {
        path: "edit/:note_slug",
        element: <NoteEditor />,
      },
      {
        path: "auth-with-alias",
        element: <AliasAuth />,
      },
      {
        path: ":note_slug",
        element: <ViewNote />,
      },
      {
        path: "faq",
        element: <Faq />,
      },
    ],
  },
  {
    path: "notes",
    element: <AuthorisedAliasNotes />,
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
