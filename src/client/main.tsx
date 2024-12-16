import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./index";
import { Provider } from "./hook";
import { createRoot } from "react-dom/client";
import ViewNote from "./ViewNote";

const route = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children: [
      {
        path: "/:note_slug",
        element: <ViewNote />,
      },
      {
        path: "/n/:alias_slug",
        element: <ViewNote />,
      },
      {
        path: "/edit",
        element: <ViewNote />,
      },
    ],
  },
]);

createRoot(document.getElementById("rroot")!).render(
  <Provider>
    <RouterProvider router={route} />
  </Provider>
);
