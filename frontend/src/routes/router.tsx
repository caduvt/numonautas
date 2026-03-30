import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout";
import { StartScreen } from "../pages/StartScreen";
import { GameScreen } from "../pages/GameScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <StartScreen /> },
      { path: "game", element: <GameScreen /> },
    ],
  },
]);
