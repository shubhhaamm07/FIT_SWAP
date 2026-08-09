import { useLocation } from "react-router-dom";
import { Heart, MessageSquare } from "lucide-react";

import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

import { pageConfig } from "./pageConfig";

function Topbar({ actions = null }) {
  const { pathname } = useLocation();

  const currentPage = pathname.startsWith("/memberships/")
    ? {
        title: "Membership Details",
        description: "Review your plan, dates, and membership progress.",
      }
    : pathname.startsWith("/gyms/")
      ? {
          title: "Gym Details",
          description: "Review gym information and official membership plans.",
        }
    : pageConfig[pathname] || {
    title: "Dashboard",
    description: "Welcome back!",
  };
  const marketplace = pathname.startsWith("/marketplace");

  return (
    <header className={`portal-topbar flex flex-col gap-4 border-b border-white/[0.08] pb-4 lg:flex-row lg:items-center ${marketplace ? "lg:justify-end" : "lg:justify-between"}`}>
      {!marketplace && <div>
        <h1 className="text-3xl font-bold text-white">{currentPage.title}</h1>

        <p className="mt-1 text-sm text-zinc-400">{currentPage.description}</p>
      </div>}

      <div className={`flex items-center gap-3 ${marketplace ? "w-full" : "flex-1 justify-end"}`}>
        <div className={`hidden w-full max-w-md ${marketplace ? "lg:hidden" : "lg:block"}`}>
          <SearchBar />
        </div>

        {actions}

        <NotificationBell />

        {marketplace && <><button aria-label="Saved listings" className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/5 lg:flex"><Heart size={19} /></button><button aria-label="Messages" className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/5 lg:flex"><MessageSquare size={19} /></button></>}

        <UserMenu />
      </div>
    </header>
  );
}

export default Topbar;
