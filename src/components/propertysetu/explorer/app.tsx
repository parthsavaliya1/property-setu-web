import { ExplorerLanguageProvider } from "./language";
import { AboutPage } from "./about";
import { PropertyHome } from "../property-home";
import { ExplorerProvider } from "./context";
import { AppChrome, RequireAccount } from "./ui";
import { LoginPage } from "./auth";
import { DetailsPage } from "./details";
import { CreatePropertyPage } from "./create";
import {
  BlockedUsersPage,
  InquiriesPage,
  MyPropertiesPage,
  NotificationsPage,
  ProfilePage,
  SavedPropertiesPage,
  SavedSearchesPage,
  VisitsPage,
  WalletPage,
} from "./account";
import { ChatPage, ChatsPage } from "./chat";
import { MapPage } from "./map";
import type { ExplorerLocation } from "@/lib/explorer";
export function ExplorerApp({
  location,
  navigate,
}: {
  location: ExplorerLocation;
  navigate: (location: ExplorerLocation) => void;
}) {
  let content;
  switch (location.view) {
    case "home":
    case "search":
      content = <PropertyHome />;
      break;
    case "create":
      content = location.id ? (
        <RequireAccount>
          <CreatePropertyPage id={location.id} />
        </RequireAccount>
      ) : (
        <CreatePropertyPage />
      );
      break;
    case "login":
      content = <LoginPage />;
      break;
    case "details":
      content = location.id ? <DetailsPage id={location.id} /> : <PropertyHome />;
      break;
    case "map":
      content = <MapPage />;
      break;
    default: {
      let page;
      switch (location.view) {
        case "wallet":
          page = <WalletPage />;
          break;
        case "history":
          page = <WalletPage historyOnly />;
          break;
        case "saved":
          page = <SavedPropertiesPage />;
          break;
        case "profile":
          page = <ProfilePage />;
          break;
        case "my-properties":
          page = <MyPropertiesPage />;
          break;
        case "inquiries":
          page = <InquiriesPage />;
          break;
        case "visits":
          page = <VisitsPage />;
          break;
        case "notifications":
          page = <NotificationsPage />;
          break;
        case "chats":
          page = <ChatsPage />;
          break;
        case "chat":
          page = location.id ? <ChatPage id={location.id} /> : <ChatsPage />;
          break;
        case "saved-searches":
          page = <SavedSearchesPage />;
          break;
        case "about":
          page = <AboutPage />;
          break;
        case "blocked":
          page = <BlockedUsersPage />;
          break;
      }
      content = location.view === "profile" ? page : <RequireAccount>{page}</RequireAccount>;
    }
  }
  return (
    <ExplorerProvider location={location} navigate={navigate}>
      <ExplorerLanguageProvider>
        <AppChrome>
          <div
            key={`${location.view}:${location.id || ""}:${location.q || ""}:${location.city || ""}:${location.category || ""}`}
          >
            {content}
          </div>
        </AppChrome>
      </ExplorerLanguageProvider>
    </ExplorerProvider>
  );
}
