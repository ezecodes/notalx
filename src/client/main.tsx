import "react-quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";

import React, { Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "./hook";
import { createRoot } from "react-dom/client";
import { Slide, ToastContainer } from "react-toastify";
import { register as registerSW } from "./service-worker-registration";
import { RingsLoader } from "./component";

// Lazy load components
const Home = React.lazy(() => import("./index"));
const ViewNote = React.lazy(() => import("./ViewNote"));
const NoteCreator = React.lazy(() => import("./NoteCreator"));
const NoteEditor = React.lazy(() => import("./NoteEditor"));
const CreateAlias = React.lazy(() => import("./AliasCreator"));
const AliasAuth = React.lazy(() => import("./AliasAuth"));
const Faq = React.lazy(() => import("./Faq"));
const TaskEditor = React.lazy(() => import("./TaskEditor"));
const AuthWrapper = React.lazy(() => import("./AuthWrapper"));

const route = createBrowserRouter([
  {
    path: "newnote",
    element: (
      <Suspense fallback={<RingsLoader />}>
        <AuthWrapper>
          <NoteCreator />
        </AuthWrapper>
      </Suspense>
    ),
  },
  {
    path: "note/:note_slug",
    element: (
      <Suspense fallback={<RingsLoader />}>
        <AuthWrapper>
          <NoteEditor />
        </AuthWrapper>
      </Suspense>
    ),
  },
  {
    path: ":note_slug",
    element: (
      <Suspense fallback={<RingsLoader />}>
        <AuthWrapper>
          <ViewNote />
        </AuthWrapper>
      </Suspense>
    ),
  },
  {
    path: "task/:task_id",
    element: (
      <Suspense fallback={<RingsLoader />}>
        <AuthWrapper>
          <TaskEditor />
        </AuthWrapper>
      </Suspense>
    ),
  },
  {
    path: "/",
    element: (
      <Suspense fallback={<RingsLoader />}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: "login",
    element: (
      <Suspense fallback={<RingsLoader />}>
        <AliasAuth />
      </Suspense>
    ),
  },
  {
    path: "newalias",
    element: (
      <Suspense fallback={<RingsLoader />}>
        <CreateAlias />
      </Suspense>
    ),
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

// Call this at the end of the render process
registerSW();
