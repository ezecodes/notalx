import "react-quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";

import React, { Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "./hook";
import { createRoot } from "react-dom/client";
import { Slide, ToastContainer } from "react-toastify";
import { register as registerSW } from "./service-worker-registration";

// Lazy load components
import Home from "./index";
import ViewNote from "./ViewNote";
import NoteCreator from "./NoteCreator";
import NoteEditor from "./NoteEditor";
import CreateAlias from "./AliasCreator";
import AliasAuth from "./AliasAuth";
import TaskEditor from "./TaskEditor";
import AuthWrapper from "./AuthWrapper";

const route = createBrowserRouter([
  {
    path: "newnote",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthWrapper>
          <NoteCreator />
        </AuthWrapper>
      </Suspense>
    ),
  },
  {
    path: "note/:note_slug",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthWrapper>
          <NoteEditor />
        </AuthWrapper>
      </Suspense>
    ),
  },
  {
    path: ":note_slug",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthWrapper>
          <ViewNote />
        </AuthWrapper>
      </Suspense>
    ),
  },
  {
    path: "task/:task_id",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthWrapper>
          <TaskEditor />
        </AuthWrapper>
      </Suspense>
    ),
  },
  {
    path: "/",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: "login",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AliasAuth />
      </Suspense>
    ),
  },
  {
    path: "newalias",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
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
