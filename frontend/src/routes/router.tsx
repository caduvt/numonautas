import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout";
import Home from "../pages/home";
import { Question } from "../pages/question";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "question", element: <Question /> },
    ],
  },
]);
