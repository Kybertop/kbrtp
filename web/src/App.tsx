import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Shell } from "./components/layout/Shell";
import { HomePage } from "./pages/HomePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { GuestbookPage } from "./pages/GuestbookPage";
import { SettingsPage } from "./pages/SettingsPage";
import { FreeGamesPage, GamingLayout, GamingOverviewPage, OutlastPage, SteamPage } from "./pages/gaming/GamingPages";
import { FortniteSearchPage, FortniteShopPage, RareReturnsPage } from "./pages/gaming/FortnitePages";
import { DbdBuildsPage, DbdPerksPage, DbdShrinePage } from "./pages/gaming/DbdPages";
import { NotFoundPage } from "./pages/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "resources", element: <ResourcesPage /> },
      { path: "guestbook", element: <GuestbookPage /> },
      { path: "settings", element: <SettingsPage /> },
      {
        path: "gaming",
        element: <GamingLayout />,
        children: [
          { index: true, element: <GamingOverviewPage /> },
          { path: "fortnite", element: <FortniteShopPage /> },
          { path: "fortnite/returns", element: <RareReturnsPage /> },
          { path: "fortnite/search", element: <FortniteSearchPage /> },
          { path: "dbd", element: <DbdShrinePage /> },
          { path: "dbd/builds", element: <DbdBuildsPage /> },
          { path: "dbd/perks", element: <DbdPerksPage /> },
          { path: "outlast", element: <OutlastPage /> },
          { path: "steam", element: <SteamPage /> },
          { path: "free", element: <FreeGamesPage /> }
        ]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);

export function App() {
  return <RouterProvider router={router} />;
}
